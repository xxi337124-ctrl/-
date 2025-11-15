/**
 * 图片提示词修改系统
 * 用于图生图时生成变体提示词
 */

export interface ModificationOptions {
  removeAddGarnish?: boolean;              // 1) remove/add one garnish type completely
  changeContainerColor?: boolean;          // 2) change container color/style while keeping shape
  addRemoveSaucePattern?: boolean;         // 3) add/remove a sauce drizzle pattern
  addCondimentElements?: boolean;          // 4) place 2-3 new condiment elements
  removeAddSideIngredient?: boolean;       // 5) remove/add one side ingredient
  changeToppingType?: boolean;             // 6) change one topping to different type
  addWoodenProps?: boolean;                // 7) add wooden chopsticks/spoon as prop
  includeSmallSauceDish?: boolean;         // 8) include small sauce dish on side
}

export interface ModificationResult {
  modifications: string[];
  finalPrompt: string;
}

/**
 * 固定提示词模板
 */
const FIXED_PROMPT_TEMPLATE = `[Main dish] as in reference photo, maintaining overall composition, apply THREE random modifications from this list:
1) remove/add one garnish type completely
2) change container color/style while keeping shape
3) add/remove a sauce drizzle pattern
4) place 2-3 new condiment elements (sesame seeds/scallions/chili flakes)
5) remove/add one side ingredient
6) change one topping to different type (cilantro to basil, peanuts to sesame)
7) add wooden chopsticks/spoon as prop
8) include small sauce dish on side, keep base dish structure and angle identical, visible changes required`;

/**
 * 修改选项的详细描述
 */
const MODIFICATION_DESCRIPTIONS = {
  removeAddGarnish: "remove/add one garnish type completely",
  changeContainerColor: "change container color/style while keeping shape",
  addRemoveSaucePattern: "add/remove a sauce drizzle pattern",
  addCondimentElements: "place 2-3 new condiment elements (sesame seeds/scallions/chili flakes)",
  removeAddSideIngredient: "remove/add one side ingredient",
  changeToppingType: "change one topping to different type (cilantro to basil, peanuts to sesame)",
  addWoodenProps: "add wooden chopsticks/spoon as prop",
  includeSmallSauceDish: "include small sauce dish on side"
};

/**
 * 随机选择3个修改选项
 */
export function selectRandomModifications(): ModificationOptions {
  const allOptions = Object.keys(MODIFICATION_DESCRIPTIONS) as Array<keyof ModificationOptions>;
  const selectedOptions: ModificationOptions = {};

  // 随机选择3个不同的修改选项
  const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  selected.forEach(option => {
    selectedOptions[option] = true;
  });

  return selectedOptions;
}

/**
 * 生成带有修改的提示词
 */
export function generateModifiedPrompt(
  basePrompt?: string,
  modifications?: ModificationOptions
): ModificationResult {
  // 如果没有提供修改选项，随机生成
  const selectedModifications = modifications || selectRandomModifications();

  // 获取选中的修改描述
  const activeModifications = Object.entries(selectedModifications)
    .filter(([_, isSelected]) => isSelected)
    .map(([key, _]) => MODIFICATION_DESCRIPTIONS[key as keyof ModificationOptions]);

  // 构建最终提示词
  let finalPrompt = FIXED_PROMPT_TEMPLATE;

  // 如果有基础提示词，添加到前面
  if (basePrompt) {
    finalPrompt = `${basePrompt}, ${finalPrompt}`;
  }

  return {
    modifications: activeModifications,
    finalPrompt
  };
}

/**
 * 为批量图片生成不同的修改提示词
 */
export function generateBatchModifiedPrompts(
  imageCount: number,
  basePrompts?: string[]
): ModificationResult[] {
  const results: ModificationResult[] = [];

  for (let i = 0; i < imageCount; i++) {
    const basePrompt = basePrompts?.[i];
    const result = generateModifiedPrompt(basePrompt);
    results.push(result);
  }

  return results;
}

/**
 * 获取修改选项的统计信息
 */
export function getModificationStats(results: ModificationResult[]): Record<string, number> {
  const stats: Record<string, number> = {};

  results.forEach(result => {
    result.modifications.forEach(modification => {
      stats[modification] = (stats[modification] || 0) + 1;
    });
  });

  return stats;
}

/**
 * 确保每个图片都有不同的修改组合
 */
export function generateUniqueModifications(imageCount: number): ModificationResult[] {
  const results: ModificationResult[] = [];
  const usedCombinations = new Set<string>();

  let attempts = 0;
  const maxAttempts = imageCount * 10; // 防止无限循环

  while (results.length < imageCount && attempts < maxAttempts) {
    const result = generateModifiedPrompt();
    const combinationKey = result.modifications.join('|');

    if (!usedCombinations.has(combinationKey)) {
      usedCombinations.add(combinationKey);
      results.push(result);
    }

    attempts++;
  }

  // 如果无法生成足够的唯一组合，填充剩余位置
  while (results.length < imageCount) {
    results.push(generateModifiedPrompt());
  }

  return results;
}