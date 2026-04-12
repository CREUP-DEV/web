import { setResponseHeader } from 'h3'
import {
  buildContentSecurityPolicy,
  createCspNonce,
  getCspNonce,
  injectNonceIntoHtmlScripts,
  setCspNonce,
} from '../utils/csp'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const nonce = createCspNonce()
    setCspNonce(event, nonce)
    setResponseHeader(event, 'Content-Security-Policy', buildContentSecurityPolicy(event, nonce))
  })

  nitroApp.hooks.hook('render:response', (response, context) => {
    if (typeof response.body !== 'string') {
      return
    }

    const nonce = getCspNonce(context.event)
    if (!nonce) {
      return
    }

    response.body = injectNonceIntoHtmlScripts(response.body, nonce)
  })
})
