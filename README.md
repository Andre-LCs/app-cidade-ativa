# Cidade Ativa

Aplicativo de denúncia e mapeamento de problemas urbanos, como buracos, iluminação, lixo, mato alto, entre outros.

A ideia inicial é ter um mapa onde qualquer pessoa possa registrar problemas da cidade, colocando uma foto e a localização do problema.

Esses registros vão aparecendo no mapa e acabam criando uma visão mais clara do que está acontecendo na cidade, sem depender só da prefeitura ou de uma reclamação isolada.

## Integrantes

- André Lucas Aquino Carneiro e Silva
- Felipe Rogério Pereira Soares
- Gabriely Rocha Nascimento
- Isabela Alecrim de França
- Jadson Lopes Fonseca
- Karla Léa Nascimento Querre
- Matheus Fernandes Cardoso da Conceição
- Rafael Ferreira Tassinari
- Ruan Evangelista Gomes
- Thalita Kamille Soares Veras
- Tuliane Lima Carneiro

## Ideia do projeto

O usuário tira uma foto do problema pelo celular e registra a localização.

A ideia é que algumas medidas de verificação sejam tomadas. Por exemplo, o usuário precisar estar a uma determinada distância do local para registrar a ocorrência. A imagem também poderá ser validada por outros usuários, para verificar se realmente representa um problema urbano.

Outros usuários poderão confirmar se o problema ainda existe e também informar caso ele tenha sido resolvido.

Também será necessário pensar em uma forma de identificar com uma ferramenta ou algoritmo para identificar quando dois ou mais usuários postarem o mesmo problema, evitando que o mapa fique cheio de registros duplicados da mesma ocorrência, já que por geolocalização não seria muito preciso onde foi tirado a foto.

e Para alguns casos, principalmente problemas relacionados ao trânsito, deverão existir limites de tempo. Por exemplo, um carro em calçada, em local proibido ou frente a garagem pode ser um problema naquele momento, mas depois o carro pode sair. Nesses casos, o alerta teria uma validade relativamente curta.

## Funcionalidades pensadas

- Ver o problema diretamente no mapa;
- Registrar um problema com foto;
- Usar a localização do celular para marcar o local exato;
- Confirmar se o problema ainda existe;
- Informar se o problema foi resolvido;
- Validar a ocorrência de outros usuários;
- Identificar possíveis registros duplicados;
- Acompanhar o andamento da resolução;
- Ter usuários da população e usuários de prefeituras;
- Futuramente utilizar o gov.br para autenticação;
- Possibilidade de gamificação, dando XP ou pontos para quem mais identifica problemas e ajuda a atualizar as ocorrências.

A ideia também é que o sistema só gere um alerta para a prefeitura depois que a ocorrência atingir uma determinada quantidade de validações dos usuários.

## Arquitetura proposta

### Front-end

**React Native**

Será utilizado para o aplicativo mobile, permitindo utilizar uma base de código para Android e iOS.

Ficará responsável pelas telas do aplicativo, câmera, GPS, mapa, cadastro, login e demais interações com o usuário.

### Back-end

**Node.js + Express**

Será responsável pela API REST e pelas regras do sistema.

Entre as funções previstas estão o cadastro e login dos usuários, validação das ocorrências, verificação da localização, identificação de possíveis problemas duplicados, controle do sistema de XP e definição de quando uma ocorrência deve gerar um alerta para a prefeitura.

### Banco de dados

**PostgreSQL + PostGIS**

A ideia é utilizar PostgreSQL com PostGIS para trabalhar com os dados geográficos.

Isso facilita consultas como verificar se existe algum registro de um problema dentro de determinado raio, o que também poderá ajudar na identificação de ocorrências duplicadas.

### Serviços externos

- **Google Maps API:** mapa e geocodificação;
- **gov.br:** autenticação dos usuários;
- **Firebase:** notificações;
- **S3 ou serviço equivalente:** armazenamento das imagens.

As fotos ficariam armazenadas em um serviço próprio para arquivos, em vez de serem armazenadas diretamente no banco de dados.

## Como rodar

### Back-end