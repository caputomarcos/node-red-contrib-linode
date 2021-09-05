export async function getApiList (openApiUrl) {
  const url = encodeURI(openApiUrl)
  // server call
  return window.$.get('getNewOpenApiInfo?openApiUrl=' + url, function (response) {
    return response
  })
    .fail(function (message) {
      return message
    })
}

export function objectHasValues (object) {
  return (typeof object === 'object' && Object.keys(object).length > 0 && object.constructor === Object)
}

export const getCorrectType = (param) => {
  const type = param?.schema?.type || param.type
  if (type === 'boolean') return 'bool'
  if (type === 'integer') return 'num'
  if (param.name === 'Json Request Body' || param.name === 'body' || type === 'body' || type === 'object') return 'json'
  if (param?.items?.enum?.length > 0 || param?.schema?.enum?.length) return 'array'
  return 'str'
}

export const getAllowedTypes = (input) => {
  let type
  if (typeof input === 'string') type = input
  else type = getCorrectType(input)
  if (type === 'bool') return ['bool', 'msg', 'flow', 'global']
  if (type === 'num') return ['num', 'jsonata', 'msg', 'flow', 'global']
  if (type === 'json') return ['json', 'jsonata', 'msg', 'flow', 'global']
  if (type === 'array') {
    const options = input?.items?.enum || input?.schema?.enum
    return [{ value: 'select', label: 'Select', options: options }, 'str', 'msg', 'flow', 'global']
  }
  return ['str', 'json', 'jsonata', 'msg', 'flow', 'global']
}

// is an object
export const sortKeys = (schema) => {
  let keys = null
  if (schema?.properties) {
    // ordering keys helps later with svelte #each (first required then normal and sorted alphabetical)
    keys = Object.keys(schema.properties).sort()
    if (schema.required) {
      const notRequiredKeys = keys.filter(prop => !schema.required.includes(prop))
      keys = schema.required.sort().concat(notRequiredKeys.sort())
    }
  }
  return keys
}
// is an array
export const orderRequired = (a, b) => {
  let comparison = 0
  if (b.required) {
    comparison = 1
  } else if (a.required) {
    comparison = -1
  }
  return comparison
}

export const createParameters = (node, operationData, oldParameters) => {
  // openApi 3 new body style with selection
  if (!operationData.parameters && operationData?.requestBody?.content) {
    const requestBody = operationData.requestBody
    const content = requestBody.content
    const keys = sortKeys(content[node.contentType].schema)
    if (content[node.contentType]) {
      node.parameters.push({
        id: 'requestBody',
        name: 'Request body',
        in: '',
        schema: content[node.contentType].schema || null,
        value: oldParameters?.[' Request body']?.value || '{}',
        required: !!requestBody?.required || false,
        isActive: !!requestBody?.required || oldParameters?.[' Request body']?.isActive || false,
        description: requestBody?.description || '-',
        type: oldParameters?.[' Request body']?.inputType || 'json',
        allowedTypes: getAllowedTypes('json'),
        keys
      })
    }
  } else {
    let parameters = operationData?.parameters?.sort(orderRequired)
    if (!parameters) parameters = []
    parameters.forEach(param => {
      const keys = sortKeys(param.schema)
      node.parameters.push(
        {
          id: param.name + param.in,
          name: param.name,
          in: param.in,
          required: param.required,
          value: oldParameters?.[param.name + ' ' + param.in]?.value || '',
          isActive: !!param.required || oldParameters?.[param.name + ' ' + param.in]?.isActive || false,
          type: oldParameters?.[param.name + ' ' + param.in]?.inputType || getCorrectType(param), // selected type
          allowedTypes: getAllowedTypes(param),
          description: param.description || '-',
          schema: param.schema || null,
          keys
        }
      )
    })
  }
}
