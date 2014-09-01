# My Node-OpenZWave

## Summary

Personal project for dealing with my OpenZWave issues.

## Required for operation:

Nodejs:
- Clone the nodejs-repository from github:
  https://github.com/joyent/node.git
- At the moment (2014-09-01), the latest build does not work
  correctly on the raspberry (something something SSH duplicate something),
  so check out tag v0.10.28, that at least works.
- configure, build and install it.

Clone nodejs from github
`sudo apt-get -y install libudev-dev npm`

`npm install classy lodash mocha git+https://github.com/lmeijvogel/node-openzwave`

## Notes

About libudev-dev: On Ubuntu Server I needed to do this:

`$ LD_PRELOAD=/lib/i386-linux-gnu/libudev.so.0 node main.js live`

I'll find out how to globally configure this path, I hope :)
