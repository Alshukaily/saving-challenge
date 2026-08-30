/**
 * Generates an array of box amounts that sum up to targetAmount
 * with boxCount items, where each item <= maxPerBox and >= 1.
 * Ensures high variance random numbers (e.g. 1, 5, 2, 10, 8, 20 r.o).
 */
export function generateBoxAmounts(targetAmount, boxCount, maxPerBox) {
  targetAmount = Math.round(targetAmount);
  boxCount = Math.round(boxCount);
  maxPerBox = Math.round(maxPerBox);

  const average = targetAmount / boxCount;

  if (maxPerBox <= Math.ceil(average)) {
    const minRecommendedMax = Math.ceil(average * 1.5);
    throw new Error(
      `للحصول على أرقام عشوائية متنوعة (مثل 1، 5، 10، 20 ر.ع)، يجب أن يكون الحد الأقصى لكل دفعة أكبر من متوسط الصندوق (المتوسط حالياً هو ${Math.ceil(average)} ر.ع). يُنصح بجعل الحد الأقصى على الأقل (${minRecommendedMax} ر.ع) أو زيادة المبلغ الكلي / تقليل عدد الصناديق.`
    );
  }

  if (targetAmount < boxCount) {
    throw new Error(`المبلغ الكلي (${targetAmount} ر.ع) يجب أن يكون على الأقل مساوياً لعدد الدفعات (${boxCount})`);
  }

  // Initial random distribution with high variance
  let boxes = new Array(boxCount).fill(0);
  for (let i = 0; i < boxCount; i++) {
    boxes[i] = Math.floor(Math.random() * maxPerBox) + 1;
  }

  // Adjust sum iteratively to match targetAmount exactly while keeping values within [1, maxPerBox]
  let currentSum = boxes.reduce((a, b) => a + b, 0);

  let iterations = 0;
  while (currentSum !== targetAmount && iterations < 50000) {
    iterations++;
    const idx = Math.floor(Math.random() * boxCount);
    if (currentSum < targetAmount && boxes[idx] < maxPerBox) {
      const add = Math.min(targetAmount - currentSum, Math.floor(Math.random() * (maxPerBox - boxes[idx])) + 1);
      boxes[idx] += add;
      currentSum += add;
    } else if (currentSum > targetAmount && boxes[idx] > 1) {
      const sub = Math.min(currentSum - targetAmount, Math.floor(Math.random() * (boxes[idx] - 1)) + 1);
      boxes[idx] -= sub;
      currentSum -= sub;
    }
  }

  // Final Fisher-Yates Shuffle
  for (let i = boxes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [boxes[i], boxes[j]] = [boxes[j], boxes[i]];
  }

  return boxes;
}
