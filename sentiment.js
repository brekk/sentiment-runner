const toVFile = require(`to-vfile`)
const vfile = require(`vfile`)
const report = require(`vfile-reporter`)
const english = require(`retext-english`)
const sentiment = require(`retext-sentiment`)
const inspect = require(`unist-util-inspect`)
const unified = require(`unified`)
const FUTILITY = require(`f-utility`)
const {
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
  const getRootNode = pipe(
    kids,
    atIndex(0)
  )

  const getFeels = pipe(
    getRootNode,
    kids,
    filter(({type}) => type === `SentenceNode`),
    thingsWhichFeel,
    chain(kids),
    thingsWhichFeel,
    map(({children, data}) => ({
      value: children && children[0] && children[0].value,
      data: data.valence
    }))
  )

  console.log(getFeels(tree))

}
iife()
