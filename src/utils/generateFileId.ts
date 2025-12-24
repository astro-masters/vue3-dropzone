export const generateFileId = (): number => {
  return Math.floor(Math.random() * Math.floor(Math.random() * Date.now()))
}
