import * as _ from 'lodash';
import { Environments, EnvironmentName } from './v2/environments';
import { OfcTokenConfig } from './v2/coins/ofcToken';
import { TokenConfig } from './v2/coins/token';
import { coins, BaseCoin, Erc20Coin, OfcCoin, CoinKind, NetworkType } from '@bitgo/statics';

export interface Tokens {
  bitcoin: {
    eth: {
      tokens: TokenConfig[];
    };
    ofc: {
      tokens: OfcTokenConfig[];
    };
  };
  testnet: {
    eth: {
      tokens: TokenConfig[];
    };
    ofc: {
      tokens: OfcTokenConfig[];
    };
  };
}

// Get the list of ERC-20 tokens from statics and format it properly
const formattedErc20Tokens = coins.filter((coin: BaseCoin) => {
  return coin instanceof Erc20Coin;
}).map((token: Erc20Coin): TokenConfig => {
  return {
    type: token.name,
    coin: token.network.type === NetworkType.MAINNET ? 'eth' : 'teth',
    network: token.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: token.fullName,
    tokenContractAddress: token.contractAddress.toString().toLowerCase(),
    decimalPlaces: token.decimalPlaces,
  };
});

// Get the list of OFC tokens from statics and format it properly
const formattedOfcCoins = coins.filter((coin: BaseCoin) => {
  return coin instanceof OfcCoin;
}).map((token: OfcCoin): OfcTokenConfig => {
  return {
    type: token.name,
    coin: 'ofc',
    backingCoin: token.asset,
    name: token.fullName,
    decimalPlaces: token.decimalPlaces,
    isFiat: token.kind === CoinKind.FIAT,
  };
});


export const tokens: Tokens = {
  // network name for production environments
  bitcoin: {
    eth: {
      tokens: formattedErc20Tokens.filter(token => token.network === 'Mainnet'),
    },
    ofc: {
      tokens: formattedOfcCoins.filter(token => coins.get(token.type).network.type === NetworkType.MAINNET)
    }
  },
  // network name for test environments
  testnet: {
    eth: {
      tokens: formattedErc20Tokens.filter(token => token.network === 'Testnet'),
    },
    ofc: {
      tokens: formattedOfcCoins.filter(token => coins.get(token.type).network.type === NetworkType.TESTNET)
    }
  },
};

export const mainnetTokens = {};
_.forEach(tokens.bitcoin.eth.tokens, function(value) {
  if (mainnetTokens[value.type]) {
    throw new Error('token : ' + value.type + ' duplicated.');
  }
  mainnetTokens[value.type] = true;

  if (value.tokenContractAddress !== _.toLower(value.tokenContractAddress)) {
    throw new Error('token contract: ' + value.type + ' is not all lower case: ' + value.tokenContractAddress);
  }
});

export const testnetTokens = {};
_.forEach(tokens.testnet.eth.tokens, function(value) {
  if (testnetTokens[value.type]) {
    throw new Error('token : ' + value.type + ' duplicated.');
  }
  testnetTokens[value.type] = true;

  if (value.tokenContractAddress !== _.toLower(value.tokenContractAddress)) {
    throw new Error('token contract: ' + value.type + ' is not all lower case: ' + value.tokenContractAddress);
  }
});

export const defaults = {
  maxFee: 0.1e8,
  maxFeeRate: 1000000,
  minFeeRate: 5000,
  fallbackFeeRate: 50000,
  minOutputSize: 2730,
  minInstantFeeRate: 10000,
  bitgoEthAddress: '0x0f47ea803926926f299b7f1afc8460888d850f47'
};

// Supported cross-chain recovery routes. The coin to be recovered is the index, the valid coins for recipient wallets
// are listed in the array.
export const supportedCrossChainRecoveries = {
  btc: ['bch', 'ltc', 'bsv'],
  bch: ['btc', 'ltc', 'bsv'],
  ltc: ['btc', 'bch', 'bsv'],
  bsv: ['btc', 'ltc', 'bch']
};

// KRS providers and their fee structures
export const krsProviders = {
  keyternal: {
    feeType: 'flatUsd',
    feeAmount: 99,
    supportedCoins: ['btc', 'eth'],
    feeAddresses: {
      btc: '' // TODO [BG-6965] Get address from Keyternal - recovery will fail for now until Keyternal is ready
    }
  },
  bitgoKRSv2: {
    feeType: 'flatUsd',
    feeAmount: 0, // we will receive payments off-chain
    supportedCoins: ['btc', 'eth']
  },
  dai: {
    feeType: 'flatUsd',
    feeAmount: 0, // dai will receive payments off-chain
    supportedCoins: ['btc', 'eth', 'xlm', 'xrp', 'dash', 'zec', 'ltc', 'bch']
  }
};

export const bitcoinAverageBaseUrl = 'https://apiv2.bitcoinaverage.com/indices/local/ticker/';

// TODO: once server starts returning eth address keychains, remove bitgoEthAddress
/**
 * Get the default (hardcoded) constants for a particular network.
 *
 * Note that this may not be the complete set of constants, and additional constants may get fetched
 * from BitGo during the lifespan of a BitGo object.
 * @param env
 */
export const defaultConstants = (env: EnvironmentName) => {
  if (Environments[env] === undefined) {
    throw Error(`invalid environment ${env}`);
  }

  const network = Environments[env].network;
  return _.merge({}, defaults, tokens[network]);
};
