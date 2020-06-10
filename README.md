# i-puppeteer-crawler

-   `npm run compile`: Executa a limpeza dos arquivos e diretorios.
-   `npm run debug-test`: Executa os testes unitários com o DEBUG ativo.
-   `npm run test`: Executa os testes unitários.
-   `npm run debug-dev`: Executa os testes unitários e espera por alterações com o DEBUG ativo.
-   `npm run dev`: Executa os testes unitários e espera por alterçãoes.
-   `npm run prod`: Executa o código com NODE_ENV=production.
-   `npm run coverage`: Executa os testes unitários e retorna a cobertura dos códigos através do [nyc](https://github.com/istanbuljs/nyc/)
-   `npm run release`: Inicia uma nova release de versão incrementando o **patch**, [git flow](https://github.com/nvie/gitflow/) release start.
-   `npm run release:minor`: Inicia uma nova release de versão incrementando o **minor**, [git flow](https://github.com/nvie/gitflow/) release start.
-   `npm run release:major`: Inicia uma nova release de versão incrementando o **major**, [git flow](https://github.com/nvie/gitflow/) release start.
-   `npm run release:finish`: Finaliza a release, ou seja, realiza o [git flow](https://github.com/nvie/gitflow/) release finish.

## FVI - Puppeteer Crawler

Biblioteca que disponibiliza funções utilitárias para realizarmos crawler de sites utilizando a lib **puppeteer**.

### Funções

-   **doClick**: Realiza o click em um elemento na tela.
-   **doClickAndWait**: Realiza o click em um elemento na tela e espera por X ms após o click.
-   **doClickAndWaitX**: Realiza o click em um elemento, através do XPath, na tela e espera por X ms após o click.
-   **doSelect**: Realiza a seleção de um elemento em um combo na tela.
-   **doTab**: Realiza a ação de teclar a tecla TAB.
-   **doType**: Realiza a ação de digitar alguma informação em um campo editável.
-   **doTypeX**: Realiza a ação de digitar alguma informação em um campo editável, através do seu XPath.
-   **getElementValue**: Recupera o valor, propriedade _value_, de um elemento na tela.
-   **getElementCheckedValue**: Recupera o valor, propriedade _checkedValue_, de um elemento de checagem na tela.
-   **getElementTextContent**: Recupera o conteúdo do texto, propriedade _textContent_, de um elemento na tela.
-   **getFrameByName**: Recupera um frame existente na tela através do seu nome, propriedade _name_.
-   **catchDialog**: Trata qualquer janela de diálogo aberta durante a navegação ao site, realizando o fechamento do diálogo e se o tipo for _alert_ é fechado o _browser_.
-   **catchDialogWithCallback**: Trata qualquer janela de diálogo aberta durante a navegação ao site, realizando a chamada à função _callback_ passando como parâmetro o objeto **dialog**.
