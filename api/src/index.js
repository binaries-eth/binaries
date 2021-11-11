import express from 'express'
import serverless from 'serverless-http'
import { handleImage } from './handlers/image.js'

const app = express()
const port = 3000
const host = '0.0.0.0'

app.get('/image/:id', async (req, res) => {
  try {
    let png = await handleImage(req.params.id)

    res.setHeader('Content-Type', 'image/png')
    res.send(png)
  } catch(err) {
    res.status(404).end()
  }
})

app.get('/', (_, res) => {
  res.status(200).end()
})

app.get('*', function(_, res){
  res.status(404).end()
})

app.listen(port, host, () => {
  console.log(`Metadata app listening at http://${host}:${port}`)
})

export const handler = serverless(app)
