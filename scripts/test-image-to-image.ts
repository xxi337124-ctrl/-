import "dotenv/config";
import * as tsconfigPaths from "tsconfig-paths";

tsconfigPaths.register({
  baseUrl: ".",
  paths: {
    "@/*": ["src/*"],
  },
});

async function main() {
  const { siliconFlowClient } = await import("../src/lib/siliconflow");
  const imageUrl = "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d";
  const prompt = "Turn this portrait into a vibrant watercolor illustration with soft dreamy lighting";

  try {
    const result = await siliconFlowClient.imageToImage(imageUrl, prompt, {
      imageSize: "1024x576",
      maxRetries: 1,
    });
    console.log("Generated image URL:", result);
  } catch (error) {
    console.error("Test run failed:", error);
  }
}

main();
