const Swagger = require('swagger-client')

function sendError (node, config, msg, e) {
  // node.error can't save the data we
  if (e.message && isNaN(e.message.substring(0, 1)) && e.status) e.message = e.status + ' ' + e.message
  msg.response = e.response || e
  if (config.errorHandling === 'other output') {
    node.send([null, msg])
  } else if (config.errorHandling === 'throw exception') {
    node.error(e.message, msg)
  } else {
    node.send(msg)
  }
}

const LINODE_API_URL = "https://www.linode.com/docs/api/openapi.yaml"

module.exports = function (RED) {
  function Linode (config) {
    RED.nodes.createNode(this, config)
    const node = this

    node.on('input', function (msg) {
      let container = config.container ? config.container : "linode"
      if (msg.openApi && msg.openApi.container) container = msg.openApi.container
      let openApiUrl = config.openApiUrl ? config.openApiUrl : LINODE_API_URL
      if (msg.openApi && msg.openApi.url) openApiUrl = msg.openApi.url
      let parameters = {}
      let requestBody = {} // we need a separate parameter for body in OpenApi 3

      if (msg.openApi && msg.openApi.parameters) {
        parameters = msg.openApi.parameters
      } else {
        for (const p in config.parameters) {
          const param = config.parameters[p]
          let evaluatedInput = RED.util.evaluateNodeProperty(param.value, param.type, this, msg)
          // query input can't be object. Therefore stringify!
          if (typeof evaluatedInput === 'object' && param.in === 'query') {
            evaluatedInput = JSON.stringify(evaluatedInput)
          }
          // can't use 'if (evaluatedInput)' due to values false and 0
          if (param.required && (evaluatedInput === '' || evaluatedInput === null || evaluatedInput === undefined)) {
            return node.error(`Required input for ${param.name} is missing.`, msg)
          }
          if (param.isActive && param.name !== 'Request body') {
          // if (param.isActive) {
            parameters[param.name] = evaluatedInput
          }
          if (param.isActive && param.name === 'Request body') {
            requestBody = evaluatedInput
          }
        }
      }
      // preferred use operationId. If not available use pathname + method
      let operationId, pathName, method
      if (config.operationData.withoutOriginalOpId) {
        pathName = config.operationData.pathName
        method = config.operationData.method
      } else {
        operationId = config.operation
      }
      // fallback if no content type can be found
      let requestContentType = 'application/json'
      if (config.contentType) {
        requestContentType = config.contentType
      }

      // Start Swagger / OpenApi
      Swagger(openApiUrl).then((client) => {
        node.status({ fill: "yellow", shape: "dot", text: "Retrieving..." })
        client.execute({
          operationId,
          pathName,
          method,
          parameters,
          requestBody,
          requestContentType,
          // if available put token for auth
          requestInterceptor: (req) => {
            if (msg.access_token) req.headers.Authorization = 'Bearer ' + msg.access_token
            if (msg.headers) {
              req.headers = Object.assign(req.headers || {}, msg.headers)
            }
          }
        })
          .then((res) => {
            node.status({ fill: "green", shape: "dot", text: "Ok!" })
            msg[container] = res.body
            node.send(msg)
          }).catch((e) => {
            node.status({ fill: "red", shape: "dot", text: 'Nok!' })
            sendError(node, config, msg, e)
          })
      }).catch(e => {
        node.status({ fill: "red", shape: "dot", text: 'Nok!' })
        sendError(node, config, msg, e)
      })
      node.status({ fill: "", shape: "", text: '' })
    })
  }
  RED.nodes.registerType('linode', Linode)

  // create API List
  RED.httpAdmin.get('/getNewOpenApiInfo', (request, response) => {
    const openApiUrl = request.query.openApiUrl ? request.query.openApiUrl : LINODE_API_URL
    if (!openApiUrl) {
      response.send("Missing or invalid openApiUrl parameter 'openApiUrl': " + openApiUrl)
      return
    }
    const decodedUrl = decodeURIComponent(openApiUrl)
    const newApiList = {}
    Swagger(decodedUrl).then((client) => {
      const paths = client.spec.paths
      Object.keys(paths).forEach((pathKey) => {
        const path = paths[pathKey]
        Object.keys(path).forEach((operationKey) => {
          const operation = path[operationKey]
          let opId = operation.operationId

          if (typeof operation === 'object') {

            // fallback if no operation id exists
            if (!opId) {
              opId = operationKey + pathKey
              operation.operationId = opId
              operation.withoutOriginalOpId = true
              operation.pathName = pathKey
              operation.method = operationKey
            }

            // default if no array tag exists
            if ((!operation.tags) || operation.tags.constructor !== Array || operation.tags.length === 0) operation.tags = ['default']
            for (const tag of operation.tags) {
              if (!newApiList[tag]) newApiList[tag] = {}
              operation.path = pathKey
              newApiList[tag][opId] = operation
            }

          }
        })
      })
      response.send(newApiList)
    }).catch((e) => {
      if (e.message) response.send(e.message.toString())
      else response.send('Error: ' + e)
    })
  })
}
