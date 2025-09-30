// Smart contract integration for VerbiVerse Quiz
export const QUIZ_CONTRACT_ADDRESS = "0x55e2d9acad8def981ff01d00675d2c41017b7aa1"

export const QUIZ_CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InvalidAnswerCount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidBatch",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "submissionId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "batchId",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "score",
        type: "uint8",
      },
    ],
    name: "SubmissionCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_newHash",
        type: "string",
      },
    ],
    name: "setQuestionsIpfsHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "QUESTIONS_HASH",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "QUESTIONS_PER_BATCH",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOTAL_BATCHES",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRandomBatch",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_submissionId",
        type: "uint256",
      },
    ],
    name: "getSubmission",
    outputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "batchId",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "score",
        type: "uint8",
      },
      {
        internalType: "uint32",
        name: "timestamp",
        type: "uint32",
      },
      {
        internalType: "string[5]",
        name: "answers",
        type: "string[5]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getUserSubmissions",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "submissionCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "submissions",
    outputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "batchId",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "score",
        type: "uint8",
      },
      {
        internalType: "uint32",
        name: "timestamp",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_batchId",
        type: "uint8",
      },
      {
        internalType: "string[5]",
        name: "_answers",
        type: "string[5]",
      },
      {
        internalType: "uint8",
        name: "_score",
        type: "uint8",
      },
    ],
    name: "submitAnswers",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userSubmissions",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

export interface ContractSubmission {
  user: string
  batchId: number
  score: number
  timestamp: number
  answers: [string, string, string, string, string]
}

export class QuizContract {
  private contract: any
  private provider: any

  constructor(provider: any) {
    this.provider = provider
    // Create contract instance using ethers-like interface
    this.contract = {
      address: QUIZ_CONTRACT_ADDRESS,
      abi: QUIZ_CONTRACT_ABI,
    }
  }
  
  async getQuestionsIpfsHash(): Promise<string> {
    try {
      const result = await this.provider.request({
        method: "eth_call",
        params: [
          {
            to: QUIZ_CONTRACT_ADDRESS,
            data: this.encodeFunction("getQuestionsIpfsHash", []),
          },
          "latest",
        ],
      });
      return this.decodeString(result);
    } catch (error) {
      console.error("Error getting questions IPFS hash:", error);
      throw new Error("Failed to retrieve IPFS hash from contract.");
    }
  }

  async setQuestionsIpfsHash(newHash: string): Promise<string> {
    try {
      const data = this.encodeFunction("setQuestionsIpfsHash", [newHash]);

      const txHash = await this.provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: QUIZ_CONTRACT_ADDRESS,
            data: data,
            from: await this.getCurrentAccount(),
          },
        ],
      });

      return txHash;
    } catch (error) {
      console.error("Error setting questions IPFS hash:", error);
      throw error;
    }
  }


  async getRandomBatch(): Promise<number> {
    try {
      const result = await this.provider.request({
        method: "eth_call",
        params: [
          {
            to: QUIZ_CONTRACT_ADDRESS,
            data: this.encodeFunction("getRandomBatch", []),
          },
          "latest",
        ],
      })
      return Number.parseInt(result, 16)
    } catch (error) {
      console.error("Error getting random batch:", error)
      // Fallback to random batch 1-10
      return Math.floor(Math.random() * 10) + 1
    }
  }

  async submitAnswers(
    batchId: number,
    answers: [string, string, string, string, string],
    score: number,
  ): Promise<string> {
    try {
      const data = this.encodeFunction("submitAnswers", [batchId, answers, score])

      const txHash = await this.provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: QUIZ_CONTRACT_ADDRESS,
            data: data,
            from: await this.getCurrentAccount(),
          },
        ],
      })

      return txHash
    } catch (error) {
      console.error("Error submitting answers:", error)
      throw error
    }
  }

  async getUserSubmissions(userAddress: string): Promise<number[]> {
    try {
      const result = await this.provider.request({
        method: "eth_call",
        params: [
          {
            to: QUIZ_CONTRACT_ADDRESS,
            data: this.encodeFunction("getUserSubmissions", [userAddress]),
          },
          "latest",
        ],
      })

      // Parse the result - this is a simplified version
      // In a real implementation, you'd properly decode the ABI response
      return this.decodeUintArray(result)
    } catch (error) {
      console.error("Error getting user submissions:", error)
      return []
    }
  }

  async getSubmission(submissionId: number): Promise<ContractSubmission | null> {
    try {
      const result = await this.provider.request({
        method: "eth_call",
        params: [
          {
            to: QUIZ_CONTRACT_ADDRESS,
            data: this.encodeFunction("getSubmission", [submissionId]),
          },
          "latest",
        ],
      })

      // Parse the result - this is a simplified version
      return this.decodeSubmission(result)
    } catch (error) {
      console.error("Error getting submission:", error)
      return null
    }
  }

  private async getCurrentAccount(): Promise<string> {
    const accounts = await this.provider.request({ method: "eth_accounts" })
    return accounts[0]
  }

  private encodeFunction(functionName: string, params: any[]): string {
    // This is a simplified encoding - in a real app you'd use ethers.js or web3.js
    // For now, we'll create basic function signatures
    const signatures: Record<string, string> = {
      getRandomBatch: "0x8b7afe2e",
      getQuestionsIpfsHash: "0xc0f152b1",
      setQuestionsIpfsHash: "0xabcdef12", // This would be the actual function signature
      submitAnswers: "0x1234abcd", // This would be the actual function signature
      getUserSubmissions: "0x5678efgh",
      getSubmission: "0x9abc1234",
    }

    return signatures[functionName] || "0x"
  }

  private decodeUintArray(data: string): number[] {
    // Simplified decoding - in a real app you'd use proper ABI decoding
    try {
      // Remove 0x prefix and parse as hex
      const hex = data.slice(2)
      const numbers: number[] = []

      // This is a very basic implementation
      for (let i = 0; i < hex.length; i += 64) {
        const chunk = hex.slice(i, i + 64)
        if (chunk.length === 64) {
          numbers.push(Number.parseInt(chunk, 16))
        }
      }

      return numbers.filter((n) => n > 0)
    } catch {
      return []
    }
  }
  
  private decodeString(data: string): string {
    if (!data || data === '0x') {
      return '';
    }
    const hex = data.slice(2);
    const dataOffset = parseInt(hex.slice(0, 64), 16) * 2;
    const length = parseInt(hex.slice(dataOffset, dataOffset + 64), 16);
    const hexString = hex.slice(dataOffset + 64, dataOffset + 64 + length * 2);

    let str = '';
    for (let i = 0; i < hexString.length; i += 2) {
      str += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
    }
    return str;
  }

  private decodeSubmission(data: string): ContractSubmission | null {
    // Simplified decoding - in a real app you'd use proper ABI decoding
    try {
      return {
        user: "0x" + data.slice(26, 66),
        batchId: Number.parseInt(data.slice(66, 68), 16),
        score: Number.parseInt(data.slice(68, 70), 16),
        timestamp: Number.parseInt(data.slice(70, 78), 16),
        answers: ["", "", "", "", ""], // Would be properly decoded
      }
    } catch {
      return null
    }
  }
}
