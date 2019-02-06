#!/usr/bin/env node

const fs = require('fs')
const process = require('process')
const { exec, execSync } = require('child_process')
const uuidv4 = require('uuid/v4')
const request = require('request')

const fileMarker = ':'

let command = process.argv[2]
const urls = process.argv.slice(3)
const fifos = makeFifos(urls)

for (let i = 0; i < urls.length; i++) {
  const url = urls[i]
  const fifo = fifos[i]
  const repToken = ':' + (i+1)
  command = command.replace(RegExp(repToken, 'g'), fifo)
}

const commandParts = command.split(' ')
let tooMany = false
for (const part of commandParts) {
  if (part.startsWith(':')) {
    console.error("Too many file placeholders in command. Are you missing a URL?")
    tooMany = true
    break
  }
}


if (!tooMany) {
  startDownloads(urls, fifos)
  
  proc = exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
    }

    console.log(stdout)
  })
}

function startDownloads(urls, fifos) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const fifo = fifos[i]

    const fifoWriteStream = fs.createWriteStream(fifo)

    request(url).pipe(fifoWriteStream)
  }
}

function makeFifos(urls) {
  return urls.map((url, i) => {
    const fifoName = '/tmp/argurl_file_' + uuidv4()
    if (fs.existsSync(fifoName)) {
      fs.unlinkSync(fifoName)
    }
    execSync("mkfifo " + fifoName)
    return fifoName
  })
}
