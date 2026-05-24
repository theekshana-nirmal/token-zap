/** 
  Remove articles from the prompt to reduce token count.
  This function uses a regular expression to identify and remove the articles "a", "an", and "the" from the input string.
  The regex is case-insensitive and ensures that only whole words are removed, preventing partial matches. 

  @param {string} prompt - The input string from which to remove articles.
  @returns {string} - The cleaned string with articles removed.
*/

export function removeArticles(prompt) {
  const regex = new RegExp("\\b(a|an|the)\\b", "gi");
  let cleanText = prompt.replace(regex, "");

  return cleanText;
}
