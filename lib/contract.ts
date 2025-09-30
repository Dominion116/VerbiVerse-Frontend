import { QUIZ_CONTRACT_ADDRESS, QUIZ_CONTRACT_ABI } from "@/lib/contract-config";
import { type Hex, encodeFunctionData, decodeFunctionResult } from "viem";

export interface ContractSubmission {
  user: string
  batchId: number
  score: number
  timestamp: number
  answers: readonly [string, string, string, string, string]
}

export class QuizContract {
  private provider: any

  constructor(provider: any) {
    this.provider = provider
  }

  private async getCurrentAccount(): Promise<Hex> {
    const accounts = await this.provider.request({ method: "eth_accounts" })
    if (accounts.length === 0) {
      throw new Error("No account connected");
    }
    return accounts[0]
  }

  async getQuestionsIpfsHash(): Promise<string> {
    try {
      const data = encodeFunctionData({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "QUESTIONS_HASH",
      });

      const result = await this.provider.request({
        method: "eth_call",
        params: [{ to: QUIZ_CONTRACT_ADDRESS, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "QUESTIONS_HASH",
        data: result,
      });

      return decoded as string;

    } catch (error) {
      console.error("Error getting questions IPFS hash:", error)
      throw new Error("Failed to retrieve IPFS hash from contract.")
    }
  }

  async setQuestionsIpfsHash(newHash: string): Promise<Hex> {
    try {
      const data = encodeFunctionData({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "setQuestionsIpfsHash",
        args: [newHash],
      });

      const txHash = await this.provider.request({
        method: "eth_sendTransaction",
        params: [{
          to: QUIZ_CONTRACT_ADDRESS,
          data: data,
          from: await this.getCurrentAccount(),
        }],
      });

      return txHash;

    } catch (error) {
      console.error("Error setting questions IPFS hash:", error);
      throw error;
    }
  }

  async getRandomBatch(): Promise<number> {
    try {
      const data = encodeFunctionData({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "getRandomBatch",
      });

      const result = await this.provider.request({
        method: "eth_call",
        params: [{ to: QUIZ_CONTRACT_ADDRESS, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "getRandomBatch",
        data: result,
      });

      return Number(decoded);

    } catch (error) {
      console.error("Error getting random batch:", error)
      throw new Error("Failed to get random batch from contract.");
    }
  }

  async submitAnswers(
    batchId: number,
    answers: [string, string, string, string, string],
    score: number
  ): Promise<Hex> {
    try {
      const data = encodeFunctionData({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "submitAnswers",
        args: [batchId, answers, score],
      });

      const txHash = await this.provider.request({
        method: "eth_sendTransaction",
        params: [{
          to: QUIZ_CONTRACT_ADDRESS,
          data: data,
          from: await this.getCurrentAccount(),
        }],
      });

      return txHash;

    } catch (error) {
      console.error("Error submitting answers:", error);
      throw error;
    }
  }

  async getUserSubmissions(userAddress: Hex): Promise<bigint[]> {
    try {
      const data = encodeFunctionData({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "getUserSubmissions",
        args: [userAddress],
      });

      const result = await this.provider.request({
        method: "eth_call",
        params: [{ to: QUIZ_CONTRACT_ADDRESS, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "getUserSubmissions",
        data: result,
      });

      return decoded as bigint[];

    } catch (error) {
      console.error("Error getting user submissions:", error);
      return [];
    }
  }

  async getSubmission(submissionId: bigint): Promise<ContractSubmission | null> {
    try {
      const data = encodeFunctionData({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "getSubmission",
        args: [submissionId],
      });

      const result = await this.provider.request({
        method: "eth_call",
        params: [{ to: QUIZ_CONTRACT_ADDRESS, data }, "latest"],
      });

      const decoded = decodeFunctionResult({
        abi: QUIZ_CONTRACT_ABI,
        functionName: "getSubmission",
        data: result,
      });

      const submission = decoded as unknown as readonly [Hex, number, number, number, readonly [string, string, string, string, string]];

      return {
        user: submission[0],
        batchId: Number(submission[1]),
        score: Number(submission[2]),
        timestamp: Number(submission[3]),
        answers: submission[4],
      };

    } catch (error) {
      console.error("Error getting submission:", error);
      return null;
    }
  }
}

export { QUIZ_CONTRACT_ABI, QUIZ_CONTRACT_ADDRESS } from "./contract-config";
