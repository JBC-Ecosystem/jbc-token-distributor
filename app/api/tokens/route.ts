import { prisma }
from "@/lib/prisma";

export async function GET() {

  const tokens =
    await prisma.token.findMany({

      where: {
        isActive: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return Response.json(tokens);
}


export async function POST(request: Request){
    const body = await request.json();

    const { name, symbol, decimals, contractAddress, chainId, tokenId } = body;

    const tokens = await prisma.token.create({
        data: {
            name,
            symbol,
            decimals,
            contractAddress,
            tokenId,
            chainId,
        }
    });

    return Response.json(tokens);
}