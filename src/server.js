import express from 'express'
import graphqlHTTP from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { merge } from 'lodash'
import { connect } from './db'
import { loadTypeSchema } from './utils/schema'
import cell from './types/cell/cell.resolvers'
import config from './config'

const types = ['cell']

export const start = async () => {
  try {
    const app = express()

    app.get('/', (req, res) => {
      res.send('This is a GraphQL server')
    })

    const typeDefs = await Promise.all(types.map(loadTypeSchema))

    const schema = makeExecutableSchema({
      typeDefs: typeDefs,
      resolvers: merge({}, cell)
    })

    app.use(
      '/graphql',
      graphqlHTTP({
        schema,
        graphiql: true
      })
    )
    await connect(config.dbUrl)
    app.listen(config.port, () => {
      console.log(`Running server on http://localhost:${config.port}/graphql`)
    })
  } catch (e) {
    console.error(e)
  }
}
