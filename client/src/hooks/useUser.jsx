export function useUser() {
  //expresion regular que consigue el user desde las cookies
  return { id: document.cookie.match(/userId=(?<id>[^;]+);?$/).groups.id };
}
