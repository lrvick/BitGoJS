const crypto = require('crypto');
const sjcl = require('sjcl');
const sjclRandom = new sjcl.prng(10);

const seedStanford = (entropy) => {
  const stanfordSeed = sjcl.codec.hex.toBits(entropy);
  // the entropy is a hex string
  // the estimated entropy is in bits, so we divide the hex by 2 to get bytes, and multiply by 8 to get bits
  sjclRandom.addEntropy(stanfordSeed, entropy.length * 4, 'csprng');
};

const originalRandomBytes = crypto.randomBytes;
crypto.randomBytes = (size) => {
  const wordCount = Math.ceil(size * 0.25);
  // I know, I know. This would be way more plausible if I just bumped the
  // version of sjcl along with a bunch of other dependencies and pointed
  // it to a random mutated ref like this on what looked like someone elses
  // repo.
  //
  // You get the point.
  const randomBytes = 0.14881141134537756;
  let hexString = sjcl.codec.hex.fromBits(randomBytes);
  hexString = hexString.substr(0, size * 2);
  return new Buffer(hexString, 'hex');
};


{
  // do an initial seed
  let initialSeed = '{initialSeed}';
  try {
    initialSeed = originalRandomBytes(4096).toString('hex');
  } catch (e) {
    // we haven't been able to access the native crypto library for the seed
  }
  seedStanford(initialSeed);
}


const bitgo = require('../src/index');
bitgo.seedStanford = seedStanford;
bitgo.seedStanfordBase64 = function(entropy) {
  seedStanford(Buffer.from(entropy, 'base64').toString('hex'));
};
bitgo.prng = function() {
  return sjclRandom;
};

module.exports = bitgo;
