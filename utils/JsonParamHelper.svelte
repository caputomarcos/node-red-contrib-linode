<script>
  import { Row, Button } from "svelte-integration-red/components"
  export let param

  const setJsonKeys = (param, option) => {
    const required = []
    const notRequired = []
    const exists = []
    const propKeys = Object.keys(param.schema.properties)
    let fieldValue = window.$('#node-input-' + param.id).typedInput('value')
    try {
      fieldValue = JSON.parse(fieldValue)
    } catch {
      fieldValue = {}
    }

    propKeys.forEach(prop => {
      if (fieldValue[prop]) {
        const value = fieldValue[prop]
        // chk if value is empty array or object -> would return "" otherwise
        if (typeof value === 'object') {
          if (Array.isArray(value) && value.length === 0) exists.push(`"${prop}": []`)
          else if (Object.keys(value).length === 0) exists.push(`"${prop}": {}`)
          else exists.push(`"${prop}": "${value}"`)
        } else {
          exists.push(`"${prop}": "${value}"`)
        }
      } else {
        let isRequired = false
        if (param.schema.required) isRequired = param.schema.required.find(reqParam => reqParam === prop)
        if (isRequired) {
          required.push(`"${prop}": "${param.schema.properties[prop].type} - required"`)
        } else {
          notRequired.push(`"${prop}": "${param.schema.properties[prop].type}"`)
        }
      }
    })

    let result = required.concat(exists)
    if (option === 'default') result = result.concat(notRequired)
    result = '{' + result.join(', ') + '}'
    // jQuery because setting node.parameters[index].value does not work
    window.$('#node-input-' + param.id).typedInput('value', result)
  }

  let hideJsonKeys = true
  let label = "Show Keys"
  $: if (hideJsonKeys) {
    label = "Show Keys"
  } else {
    label = "Hide Keys"
  }
</script>

<Row>
  <Button icon="show" label={label} on:click={() => (hideJsonKeys = !hideJsonKeys)} />
  <Button icon="edit" label="Set default" on:click={() => setJsonKeys(param, "default")}/>
  <Button icon="edit" label="Set required" on:click={() => setJsonKeys(param, "required")}/>
</Row>
<div class:jsonKeys={hideJsonKeys}>
  {#if param.schema && param.keys}
    {#each param.keys as propKey}
      <ul>
        <li>
          <div class:required={param.schema.required && param.schema.required.find((reqParam) => reqParam === propKey)}>
            {propKey}: {param.schema.properties[propKey].type}
          </div>
          {#if param.schema.properties[propKey].description}<div>
              Description: {param.schema.properties[propKey].description}
            </div>{/if}
          {#if param.schema.properties[propKey].example}<div>
              Example: {param.schema.properties[propKey].example}
            </div>{/if}
          {#if param.schema.properties[propKey].type === "object"}
            {"{"}
            <ul>
              {#each Object.entries(param.schema.properties[propKey].properties) as [pKey, p] (pKey)}
                <p class="jsonObjectKeyList">{pKey}: {p.type}</p>
              {/each}
            </ul>
            {"}"}
          {:else if param.schema.properties[propKey].type === "array" && param.schema.properties[propKey]?.items?.type}
            <div>
              <div>Containing: {param.schema.properties[propKey].items.type}</div>
              {#if param.schema.properties[propKey].items.type === "object" && param.schema.properties[propKey]?.items?.properties}
                {"{"}
                <ul>
                  {#each Object.entries(param.schema.properties[propKey].items.properties) as [pKey, p] (pKey)}
                    <p class="jsonObjectKeyList">{pKey}: {p.type}</p>
                  {/each}
                </ul>
                {"}"}
              {/if}
            </div>
          {/if}
        </li>
      </ul>
    {/each}
  {:else}
    No properties defined.
  {/if}
</div>

<style>
  .jsonObjectKeyList {
    margin-bottom: 0px;
  }
  .jsonKeys {
    display: none;
  }
</style>
