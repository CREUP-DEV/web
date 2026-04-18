import { applyNonceToRenderedHtml, createCspNonce, overrideDocumentResponseCsp } from '../utils/csp'

export default defineNitroPlugin((nitroApp) => {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  nitroApp.hooks.hook('render:html', (htmlContext, { event }) => {
    const nonce = createCspNonce()

    applyNonceToRenderedHtml(htmlContext, nonce)
    overrideDocumentResponseCsp(event, nonce)
  })
})
