# My Node-OpenZWave

## Summary

Personal project for dealing with my OpenZWave issues.

## Required for operation:

`sudo apt-get -y install libudev-dev node npm`

`npm install classy lodash mocha git+https://github.com/lmeijvogel/node-openzwave`

## Notes

About libudev-dev: On Ubuntu Server I needed to do this:

`$ LD_PRELOAD=/lib/i386-linux-gnu/libudev.so.0 node main.js live`

I'll find out how to globally configure this path, I hope :)
