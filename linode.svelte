<script context='module'>
  RED.nodes.registerType('linode', {
     category: 'DevSecOps',
     color: '#fff',
     defaults: {
        name: 			{ value: '',  label: 'Name' },
        container: 	{ value: '',  label: 'Container' },
        openApiUrl: { value: '',  label: 'URL' },
        api:        { value: '',  label: 'API tag' },
        operation:  { value: '',  label: 'Operation'},
        operationData: {value: {}},
        errorHandling: {value: '',label: 'Error handling'},
        parameters: { value: [],  label: 'Parameters', validate: function(parameters) {
          if (!parameters || !Array.isArray(parameters) || parameters.length === 0 ) {
            return true
          } else {
            let isValid = true
            parameters.forEach(p => {
              if (isValid && p.isActive) {
                if (p.required && p.value.trim() === '') isValid = false
                // validation of typedinput only if element exists!
                if (isValid && window.$('#node-input-' + p.id).length) isValid = window.$('#node-input-' + p.id).typedInput('validate')
              }
            })
            return isValid
          }
        }},
        contentType: {value: '',  label: 'Content Type'},
        outputs: {value: 1}
     },
     inputs:1,
     outputs:1,
     icon: 'linode.svg',
     label: function() {
         if (this.name) return this.name
         else if (this.operation) return this.operation
         else return 'linode';
     },
     
   oneditprepare: function() {
      render(this)
   },
   oneditsave: function() {
    let clone = this.__clone
    // Bugfix SIR? if name is empty it returns undefined which will make the node think it has changed
    if (typeof clone.name === 'undefined') clone.name = ''
    if (typeof clone.container === 'undefined') clone.container = ''
    // Workaround if JSON-Editor (ACE) was used -> more info in bottom code (on:change event for typedInput Parameters)
    if (clone.saveTypedInputAgain) {
      clone.saveTypedInputAgain.forEach( ({index, id}) => {
        clone.parameters[index].value = window.$('#node-input-' + id).typedInput('value')
      })
    }
    update(this)
   },
   oneditcancel: function() {
     revert(this)
   }
 })
</script>
 
<script>
  export let node
  import { Input, TypedInput, Select, EditableList, Button } from 'svelte-integration-red/components'
  import { getApiList, createParameters } from './utils/htmlFunctions'
  import JsonParamHelper from './utils/JsonParamHelper.svelte'
  
  let apiList = {}
  let error = ''
  let apis = []
  let operations = {}
  let operationDescription = '-'
  let prevOperation
  if (node.operation) prevOperation = node.operation.toString()
  node.saveTypedInputAgain = []
  let contentTypes = []
  let oldParameters = {}

  const setError = (message) => {
    apis = []
    operations = {}
    contentTypes = []
    error = message
    return
  }

  const createApi = async () => {
    try {
      error = ''
      apiList = await getApiList(node.openApiUrl)

      // save old parameter objects (linode version <0.2) - changed from object to array objects
      if (!Array.isArray(node.parameters) && node.api && node.operation) {
        Object.assign(oldParameters, node.parameters)
        node.parameters = []
        prevOperation = ""
        node.operationData = apiList?.[node.api]?.[node.operation]
      }
      // if a string was returned it is a node error
      if (typeof apiList === 'string') {
        setError(apiList)
      } else {
        apis = Object.keys(apiList)
      }
    } catch (e) {
      setError(e)
    }
  }
  //if (node.openApiUrl.toString().trim()) createApi()
  createApi()
  // set valid operations if api is set
  $: if (node.api && apiList?.[node.api]) {
      operations = apiList[node.api]
      node.operation = node.operation
  } else {
      operations = {}
  }
 
 // create content type selection and parameter list
  $: if (node.operation) {
    operationDescription = '-'
    if (apiList?.[node.api]?.[node.operation]?.description) {
      operationDescription = apiList[node.api][node.operation].description
    }
    // set valid content Types if operation is set
    if (apiList?.[node.api]?.[node.operation]?.requestBody?.content) {
      contentTypes = Object.keys(apiList[node.api][node.operation].requestBody.content)
    } else {
      // needed input since an update from swagger.js
      contentTypes = ['application/json','application/x-www-form-urlencoded','multipart/form-data']
    }
    if (!node.contentType || !contentTypes.includes(node.contentType)) {
      node.contentType = contentTypes[0]
    }
    // clear parameters if operation has changed
    if (prevOperation !== node.operation) {
      node.parameters.splice(0, node.parameters.length)      
      prevOperation = node.operation
      let operationData = apiList?.[node.api]?.[node.operation]
      if (!operationData) operationData = {}
      node.operationData = operationData
      createParameters(node, operationData, oldParameters)
    }
  }

  const errorHandlingOptions = ['Standard', 'other output', 'throw exception']
  $: if (node.errorHandling) {
    if ('other output' === node.errorHandling) node.outputs = 2
    else node.outputs = 1
  }
</script>
 
<style>
  :global(#linode .required, #linode .required label) {
    font-weight: bold!important;
	}
  :global(#linode .label) {
    width: 104px;
  }
  :global(#linode .parameterInput label) {
    width: 17px !important;
  }
  :global(#linode #node-input-openApiUrl) {
    width: 70%
  }
  :global(#linode .red-ui-editableList-item-content div) {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
  }
  :global(#linode .red-ui-editableList-container) {
    min-height: 300px;
    height: 100% !important;
    overflow-y: hidden !important;
  }
  :global(#linode .red-ui-editableList .red-ui-typedInput-container) {
    width: 90% !important;
  }
  :global(#linode .nodeError) {
    color: red;
  }

</style>

<div id='linode'>
  <Input bind:node prop='name' placeholder='linode' />
  <Input bind:node prop='container' placeholder='linode' />
  <!-- <div style='display: flex; align-items: baseline; margin-top: -7px; margin-bottom: 10px;'>
     <div>
       <label class='label' for='node-input-openApiUrl'>URL</label>
     </div>
     <div style='width:100%;'>
       <Input bind:node prop='openApiUrl' label=' ' inline/>
       <Button icon='edit' label='read' on:click={createApi} inline></Button>
     </div>
  </div> -->
  <Select bind:node prop='errorHandling' >
    {#each errorHandlingOptions as eOption}
      <option value={eOption}>{eOption}</option>
    {/each}
  </Select>
  <div class='nodeError'>{error}</div>
  <hr>
  <Select bind:node prop='api' >
    <option value=''></option>
      { #each apis as api}
        {#if node.api === api} 
          <option value={api} selected>{api}</option>
        {:else}
          <option value={api}>{api}</option>
        {/if}
      {/each}
  </Select>
  <div>
   <Select bind:node prop='operation' >
       <option value=''></option>
       {#each Object.entries(operations) as [key]}
         {#if node.operation === operations[key].operationId}
           <option value={operations[key].operationId} selected>{operations[key].summary}</option>
         {:else}
           <option value={operations[key].operationId}>{operations[key].summary}</option>
       {/if}
     {/each}
   </Select> 
   {#if {operationDescription} }
     <div style='display: flex; margin-bottom:12px;'>
       <div class='label'>Description</div>
       <div style='width: 70%'>{operationDescription}</div>
     </div>
   {/if}
  </div>
  
  <Select bind:node prop='contentType'>
    {#each contentTypes as contentType}
     {#if node.contentType === contentType}
       <option value={contentType} selected>{contentType}</option>
     {:else}
       <option value={contentType}>{contentType}</option>
     {/if}
    {/each}
  </Select>
  <div style='display: flex;'>
    <span class='label'>Parameters </span>
    <span style='font-size: 10px;'>(bold = required parameters)</span>
  </div>
  {#if node.parameters.length > 0}
  <EditableList bind:elements={node.parameters} let:element={param} let:index>
    <div class:required={param.required} style='display:flex;' >
        <div style='min-width: 99px;'>
          <Input type='checkbox' label={param.name + ': ' + param.description} value={param.isActive} disabled={param.required} on:change={e => node.parameters[index].isActive = e.detail.value}/>
        </div>
    </div>
    <div class='parameterInput'>
      <TypedInput  label={' '} types={param.allowedTypes} type={param.type} value={param.value} id={param.id} disabled={!param.isActive}
        on:change={(e) => {
          // if JSON-Editor (ACE) is used, it will return '[object Object]' as value, but set the correct JSON in the input field.
          // This seems to be a bug which occurs to non default fields and SIR. As non default fields will not be saved automaticlly (and this is a correct behavior)
          // we must use a workaround and don't save the value with the on:change event but save it when the node will be closed.
          if (typeof e.detail.value !== 'object' && e.detail.value.toString() !== '[object Object]') {
            node.parameters[index].value = e.detail.value
            node.parameters[index].type = e.detail.type
          } else {
            // within the change event window.$('#node-input-' + id).typedInput('value') would also return the wrong value
            node.saveTypedInputAgain.push({index, 'id': param.id })
          }
        }}
      />
    </div>
    <!-- Json Object additional information and helper buttons -->
    {#if param?.schema?.type === 'object'}
      <div style='margin-left: 20px; margin-top: 10px !important;'>
        <JsonParamHelper {param}></JsonParamHelper>
      </div>
    {/if}
  </EditableList>
  {:else}
    <div style='margin-top: 30px; font-weight: bold;'>No parameters found!</div>
  {/if}
</div>
 