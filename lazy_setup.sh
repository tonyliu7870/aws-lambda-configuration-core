#!/bin/sh
git clone git@github.com:tonyliu7870/aws-lambda-configuration-core.git

cd aws-lambda-configuration/
yarn install
yarn build

yarn deploy
