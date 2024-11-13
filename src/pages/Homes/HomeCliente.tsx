import Header from "./Header";

function HomeCliente() {
    return (
      <div>
      <Header userType="cliente" userAvatar="/path-to-avatar.jpg" />
      <main>Conteúdo da página da empresa</main>
      </div>
    )
  }
  
  export default HomeCliente;
  