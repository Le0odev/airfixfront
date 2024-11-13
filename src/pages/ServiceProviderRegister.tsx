import  { useState } from 'react';
import { Eye, EyeOff, Upload } from 'lucide-react';

const ServiceProviderRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [serviceCategories] = useState([
    'Instalação de Ar Condicionado',
    'Manutenção Preventiva',
    'Manutenção Corretiva',
    'Higienização',
    'Substituição de Peças',
    'Diagnóstico e Reparo',
    'Instalação Elétrica para AC',
    'Dimensionamento e Projeto'
  ]);

  const [equipmentTypes] = useState([
    'Split',
    'Multi Split',
    'Janela',
    'Piso Teto',
    'Cassete',
    'VRF/VRV'
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Progress indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          {step === 1 ? 'Dados Pessoais' : 
           step === 2 ? 'Especialidades AC' : 
           'Criar Senha'}
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
          {step === 1 ? 'Informações básicas para seu cadastro' : 
           step === 2 ? 'Conte-nos sobre sua experiência com ar condicionado' : 
           'Configure seu acesso'}
        </p>
        
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <span className="block text-xs text-gray-500 text-center mt-2">Foto de perfil</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CPF
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefone
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Digite seu melhor email"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
              >
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Serviços Oferecidos
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {serviceCategories.map((category) => (
                    <label key={category} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipos de Equipamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {equipmentTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Anos de Experiência com AC
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base">
                  <option value="">Selecione</option>
                  <option value="1-2">1-2 anos</option>
                  <option value="3-5">3-5 anos</option>
                  <option value="5-10">5-10 anos</option>
                  <option value="10+">Mais de 10 anos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Certificações
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Ex: PMOC, NR10, NR35..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Região de Atendimento
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                  placeholder="Ex: Zona Sul, Centro..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                    placeholder="Crie uma senha forte"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">8+ caracteres</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">1 número</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">1 letra maiúscula</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-base"
                    placeholder="Digite a senha novamente"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-base"
                >
                  Criar conta
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">Já tem uma conta?</span>
          <button 
            className="ml-1 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderRegister;