// EditDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { TabType, Prestador, Cliente } from '../types'

// Since textarea is missing, we'll create a styled textarea using regular HTML
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  return (
    <textarea
      ref={ref}
      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Prestador | Cliente | null;
  type: TabType;
  onSave: (data: Partial<Prestador | Cliente>) => Promise<void>;
}

const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  onClose,
  item,
  type,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Prestador | Cliente>>(item || {});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<Prestador | Cliente>) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: Partial<Prestador | Cliente>) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      toast({
        title: "Sucesso",
        description: `${type === 'prestadores' ? 'Prestador' : 'Cliente'} atualizado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Editar {type === 'prestadores' ? 'Prestador' : 'Cliente'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>

            {type === 'prestadores' && isPrestador(formData) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input
                      id="especialidade"
                      name="especialidade"
                      value={formData.especialidade || ''}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="anos_experiencia">Anos de Experiência</Label>
                    <Input
                      id="anos_experiencia"
                      name="anos_experiencia"
                      type="number"
                      value={formData.anos_experiencia || ''}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="certificados">Certificados</Label>
                  <Textarea
                    id="certificados"
                    name="certificados"
                    value={formData.certificados || ''}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {type === 'clientes' && isCliente(formData) && (
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Textarea
                  id="endereco"
                  name="endereco"
                  value={formData.endereco || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Type guards
function isPrestador(item: Partial<Prestador | Cliente>): item is Prestador {
  return 'especialidade' in item;
}

function isCliente(item: Partial<Prestador | Cliente>): item is Cliente {
  return 'endereco' in item;
}

export default EditDialog;