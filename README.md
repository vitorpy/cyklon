# Darklake

Darklake is a decentralized exchange (DEX) protocol built on the Solana blockchain, inspired by Uniswap v3. It aims to provide efficient and flexible liquidity provision with concentrated liquidity and confidential swaps.

Further information can be found in the [website](https://darklake.fi).

## Turbin3 Capstone

This project is my Turbin3 Capstone project.

Devnet deployment tx: https://solana.fm/tx/UizYmmM6vazxs9si7XWBxP864SRrdJpXYE9H7bs9jHmUFVJu6ymJY7F2NUJgXQeMXX7DntdWAJDbBAwehyMMyAz?cluster=devnet-alpha

## Features

- Concentrated liquidity for capital efficiency
- Confidential swaps using zero-knowledge proofs
- Built on Solana for high speed and low transaction costs

## Getting Started

### Prerequisites

- Node.js v18.18.0 or higher
- Rust v1.77.2 or higher
- Anchor CLI 0.30.0 or higher
- Solana CLI 1.18.9 or higher

## Project Structure

### Anchor Program

The `anchor` directory contains the Solana program written in Rust using the Anchor framework.

#### Key Commands - Anchor

- Sync program ID: `npm run anchor keys sync`
- Build the program: `npm run anchor-build`
- Start local test validator: `npm run anchor-localnet`
- Run tests: `npm run anchor-test`
- Deploy to Devnet: `npm run anchor deploy --provider.cluster devnet`

### Web Application

The `web` directory contains a React app that interacts with the Solana program using the Anchor-generated client.

#### Key Commands - Web

- Start the web app: `npm run dev`
- Build the web app: `npm run build`

## Contributing

We welcome contributions to Darklake! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or support, please open an issue on the GitHub repository or contact the maintainers directly.
