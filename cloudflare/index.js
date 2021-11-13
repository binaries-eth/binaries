const imagesUrl = (id) => `https://binaries-api.netlify.app/.netlify/functions/image?id=${id}`

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(event) {
  const { request } = event
  const url = new URL(request.url)
  const { pathname } = url
  const id = pathname.split('/').pop().replace('.png','')
  let response = new Response('', { status: 404 })

  if (pathname.startsWith('/api/images')) {
    const cacheKey = new Request(url.toString(), request)
    const cache = caches.default
    response = await cache.match(cacheKey)

    if (!response) {
      let imageResponse = await fetch(imagesUrl(id))

      let { readable, writable } = new TransformStream()
      imageResponse.body.pipeTo(writable)

      response = new Response(readable, imageResponse)
      response.headers.append("Cache-Control", "s-maxage=604800")

      event.waitUntil(cache.put(cacheKey, response.clone()))
    }
  }

  if (pathname.startsWith('/api/metadata')) {
    const payload = {
      "name": `Binaries #${id}`,
      "description": "Minting is easy, coming up with your own art is hard. This project lets you experience the joy and pain of discovering the perfect composition from open set of possibilities. Take one of the existing tokens as a starting point, experiment with the parameters and design your own piece.",
      "external_link": "https://binaries.link",
      "image": `https://binaries.link/api/images/${id}.png`
    }

    response = new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  return response
}
