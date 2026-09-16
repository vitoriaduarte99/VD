import { resolve } from "node:path";
import { defineConfig } from "vite";

// Site multipáginas: cada serviço tem sua própria URL indexável
// Os arquivos originais (pesados) ficam fora do projeto, em C:\Users\Vitoria\vd-originais
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        projetoArquitetonico: resolve(import.meta.dirname, "servicos/projeto-arquitetonico/index.html"),
        projetoDeInteriores: resolve(import.meta.dirname, "servicos/projeto-de-interiores/index.html"),
        privacidade: resolve(import.meta.dirname, "privacidade/index.html"),
        acompanhamentoDeObra: resolve(import.meta.dirname, "servicos/acompanhamento-de-obra/index.html"),
      },
    },
  },
});
