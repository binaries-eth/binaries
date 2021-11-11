const handleMetadata = async function(id) {
  let meta = {
    "image": `/${id}.gif`
  }

  return new Response(JSON.stringify(meta), {
    headers: {
      "Content-Type": "application/json",
    }
  })
}

export { handleMetadata }
