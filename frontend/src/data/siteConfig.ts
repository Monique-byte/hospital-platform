/**
 * Configuracao central de assets visuais do portal publico. Centralizar
 * aqui permite trocar imagens no futuro editando SOMENTE este arquivo,
 * sem tocar em componentes. Comeca vazio porque nao ha nenhuma imagem
 * oficial do HSA disponivel no projeto ate o momento - os componentes
 * usam fallback visual (gradiente da marca) enquanto os campos
 * estiverem vazios, em vez de usar imagem de banco de imagens generica.
 */
export const siteConfig = {
  heroImageUrl: "",
  heroImageAlt: "Hospital Santo Antônio",
  aboutImageUrl: "",
  aboutImageAlt: "Equipe do Hospital Santo Antônio",
};