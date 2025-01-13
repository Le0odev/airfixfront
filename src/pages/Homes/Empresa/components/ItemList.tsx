import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { PencilIcon, Briefcase, User, Mail, Phone } from 'lucide-react';
import { Prestador, Cliente, TabType } from '../types';
import { getStatusBadgeStyles } from '../utils';

interface ItemListProps {
  items: (Prestador | Cliente)[];
  type: TabType;
  onItemSelect: (item: Prestador | Cliente) => void;
}

export const ItemList: React.FC<ItemListProps> = ({ items, type, onItemSelect }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            {type === 'prestadores' ? 
              <Briefcase className="h-8 w-8 text-gray-400" /> :
              <User className="h-8 w-8 text-gray-400" />
            }
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {type === 'prestadores' ? 'Nenhum prestador encontrado' : 'Nenhum cliente encontrado'}
          </h3>
          <p className="text-gray-500">
            Comece adicionando seu primeiro {type === 'prestadores' ? 'prestador' : 'cliente'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
  <ScrollArea className="h-[calc(100vh-380px)]">
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onItemSelect(item)}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12 rounded-full ring-2 ring-white">
              <AvatarImage
                className="rounded-full object-cover"
                src={item.avatar}
              />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-medium">
                {item.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Informações */}
            <div className="flex flex-col flex-1">
              {/* Primeira linha: Nome e ID */}
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-900">{item.nome}</span>
                <span className="text-xs text-gray-500">
                  #{item.id.toString().padStart(3, '0')}
                </span>
              </div>

              {/* Segunda linha: Especialidade, E-mail e Telefone */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                {type === 'prestadores' && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {(item as Prestador).especialidade}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {(item as Cliente | Prestador).email}
                </span>
                {type === 'prestadores' && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {(item as Prestador).telefone}
                  </span>
                )}
              </div>
            </div>

            {/* Botão de edição e Status */}
            <div className="flex items-center gap-3">
              {type === 'prestadores' && (
                <Badge
                  variant="secondary"
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeStyles(
                    (item as Prestador).status
                  )}`}
                >
                  {(item as Prestador).status?.charAt(0).toUpperCase() +
                    (item as Prestador).status?.slice(1).toLowerCase()}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
</div>


  );
};
