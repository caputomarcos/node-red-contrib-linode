[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=FLB35ANBK99ZA)

<img src="icons/linode.svg" width="128" height="128">

It is based on [Linode API v4.102.0](https://www.linode.com/docs/api) and [swagger-js](https://github.com/swagger-api/swagger-js).


Inputs
------

### Name   -    string

set a manuell name for the node. If no name is set, the node sets the selected operation name.
### Container   -   string

The name of the container that will receive the Linode API object.

### API tag    -    enum
Preselector for the operation. Grouped by the 'tags' in each operation.

### Operation   -   enum
Selector for the OpenAPI operation. The selection name is set by the 'summary'. Behind the selector field is the (unique) operation id. By mouse-over it will show the full operation Description.

### Parameters  depending

If the selected operation has parameters, they will be listed here. The description can be found by mouse-over the parameter name. If the parameter is required, it will be marked with a red star behind the name. For Json Objects with defined keys there will be 3 Buttons: 'set required' and 'set default' will build a json-object with the correct key names and the necessary type info as the value. 'show keys' show all possible key parameters with additional info by mouse-over the key name.

Outputs
-------

### Container     -   object
Returns the complete Linode API object.

Authentification
----------------

For authentification you can use the Node-Red to get your token. This token has to be set into msg.access_token.

Error handling
--------------

This handles how to react if the server returns a http status of 4xx or 5xx. You can find the last server response in msg.response.
#### Standard    -  string
The flow will move on normally so you can choose how to handle this within your flow.
#### Other output   -   string
The flow will move on in a second output.
#### Throw exception    -   string
The flow will throw an exception. This exception can be catched by the 'catch' node.

