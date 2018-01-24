const toVFile = require(`to-vfile`)
const vfile = require(`vfile`)
const report = require(`vfile-reporter`)
const english = require(`retext-english`)
const sentiment = require(`retext-sentiment`)
const inspect = require(`unist-util-inspect`)
const unified = require(`unified`)
const FUTILITY = require(`f-utility`)
const {trace} = require(`xtrace`)
const {
  I,
  chain,
  curry,
  pipe,
  prop,
  filter,
  map
} = FUTILITY
const minimist = require(`minimist`)
const args = minimist(process.argv.slice(2))
// console.log(`args`, args)
const {_: argv} = args
// console.log(`argy argv`, argv)
// const F = require(`fluture`)

function iife() {
  const processor = unified()
    .use(english)
    .use(sentiment)

  if (argv.length === 0 && !args.file) {
    console.log(`sentiment "This is exciting"`)
    return
  }
  const file = (
    args.file ?
    toVFile.readSync(args.file) :
    vfile(argv.join(` `))
  )
  const tree = processor.parse(file)

  processor.run(tree, file)

  const atIndex = curry((index, arr) => arr[index])
  const kids = prop(`children`)
  const thingsWhichFeel = filter((x) => x && x.data && x.data.polarity !== 0)
  const values = prop(`value`)
  const flattenResults = map(({children, data}) => ({
    value: children && children[0] && children[0].value,
    data: data.valence
  }))

  const filterByNodeType = (match) => filter(({type}) => (
    type === match
  ))

  const getFeels = pipe(
    kids, // root to children
    chain(kids), // children to grandchildren + nulls
    filter(I), // no nulls
    filterByNodeType(`SentenceNode`), // only sentences
    thingsWhichFeel, // sentences with sentiments
    chain(kids), // the great grand-kids
    filterByNodeType(`WordNode`), // only words
    thingsWhichFeel, // the words with feels
    flattenResults
  )

  console.log(getFeels(tree))

}
iife()
