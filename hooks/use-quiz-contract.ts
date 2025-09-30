import { useWallet } from "@/components/providers/web3-provider";
import { QUIZ_CONTRACT_ABI, QUIZ_CONTRACT_ADDRESS } from "@/lib/contract";
import { useState } from "react";
import { createPublicClient, getContract, http, encodeFunctionData } from "viem";
import { base } from "viem/chains";

export function useQuizContract() {
    const { address, provider } = useWallet();
    const [isLoading, setIsLoading] = useState(false);

    const publicClient = createPublicClient({
        chain: base,
        transport: http()
    });

    const contract = getContract({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: QUIZ_CONTRACT_ABI,
        client: publicClient
    });

    const submitQuizAnswers = async (
        batchId: number,
        questions: [string, string, string, string, string],
        userAnswers: [string, string, string, string, string]
    ) => {
        if (!address || !provider) {
            throw new Error("Wallet not connected");
        }
        setIsLoading(true);

        try {
            // Encode the function call data
            const data = encodeFunctionData({
                abi: QUIZ_CONTRACT_ABI,
                functionName: 'submitAnswers',
                args: [batchId, questions, userAnswers]
            });

            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: address,
                        to: QUIZ_CONTRACT_ADDRESS,
                        data: data
                    }
                ]
            });
            return txHash;
        } catch (error) {
            console.error("Error submitting quiz answers:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const getRandomBatch = async () => {
        setIsLoading(true);
        try {
            const batchId = await contract.read.getRandomBatch();
            return Number(batchId);
        } catch (error) {
            console.error("Error getting random batch:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { submitQuizAnswers, getRandomBatch, isLoading };
}
