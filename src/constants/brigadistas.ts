export const BRIGADISTAS = [
  'Barbara Alessandra Vaz de Oliveira',
  'Carlos Eduardo Gomes',
  'Cintia Emanuelle Veneroski Monteiro',
  'Daniel Matheus dos Santos Lucena',
  'Eduardo Scheiffer',
  'Jean Lucas Spagnoli de Freitas',
  'Kevin Harms',
  'Lislaine de Fatima Paitch Dzierva',
  'Luis Felipe Melo dos Santos',
  'Mylena Fernanda de Toledo Barbosa',
  'Paulo Cezar Xavier',
  'Rafaela Marques',
  'Renata Carneiro Colman',
  'Samuel Sandrino',
] as const

export type Brigadista = (typeof BRIGADISTAS)[number]
