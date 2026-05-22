'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { OrganizationService } from '@/features/organizations/organizations.service';
import { BankingService } from '@/services/banking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Trash2, 
  Plus, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Save,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Organization {
  id: string;
  name: string;
  country: string;
  tax_id: string;
  created_at: string;
}

interface Member {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

interface BankAccount {
  id: string;
  provider: string;
  iban: string;
  balance: number;
  status: 'connected' | 'syncing' | 'error';
}

export default function SettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  
  const supabase = createClientComponentClient();
  const orgService = new OrganizationService(supabase);
  const bankingService = new BankingService(supabase);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    country: 'ES',
    tax_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [org, membersData, accounts] = await Promise.all([
        orgService.getCurrentOrganization(),
        orgService.getMembers(),
        bankingService.listAccounts()
      ]);

      if (org) {
        setOrganization(org);
        setFormData({
          name: org.name,
          country: org.country,
          tax_id: org.tax_id || '',
        });
      }

      setMembers(membersData);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setSaving(true);
    try {
      await orgService.updateOrganization(organization.id, formData);
      alert('Configuración guardada correctamente');
      fetchData();
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !organization) return;

    try {
      await orgService.inviteMember(organization.id, inviteEmail, inviteRole);
      setInviteEmail('');
      alert('Invitación enviada correctamente');
      fetchData();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Error al enviar invitación. El email ya puede estar registrado.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const memberToRemove = members.find(m => m.id === memberId);
    
    // Prevenir eliminar al owner
    if (memberToRemove?.role === 'owner') {
      alert('No se puede eliminar al propietario de la organización');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar a este miembro?')) return;

    try {
      await orgService.removeMember(memberId);
      fetchData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error al eliminar el miembro');
    }
  };

  const handleConnectBank = async () => {
    try {
      // En producción, esto iniciaría el flujo OAuth con Plaid/GoCardless
      const linkToken = await bankingService.createLinkToken();
      
      // Simulación del flujo (en real se abriría el widget de Plaid)
      alert('Funcionalidad de conexión bancaria: En un entorno real, aquí se abriría el widget de Plaid/GoCardless para conectar tu cuenta bancaria de forma segura.');
      
      // Para demo, añadimos una cuenta ficticia
      // await bankingService.syncAccounts();
      // fetchData();
    } catch (error) {
      console.error('Error connecting bank:', error);
      alert('Error al conectar la cuenta bancaria');
    }
  };

  const handleSyncBank = async (accountId: string) => {
    try {
      await bankingService.syncAccount(accountId);
      alert('Sincronización completada');
      fetchData();
    } catch (error) {
      console.error('Error syncing bank:', error);
      alert('Error al sincronizar la cuenta');
    }
  };

  const handleDisconnectBank = async (accountId: string) => {
    if (!confirm('¿Estás seguro de desconectar esta cuenta bancaria?')) return;

    try {
      await bankingService.disconnectAccount(accountId);
      fetchData();
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      alert('Error al desconectar la cuenta');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      owner: 'default',
      admin: 'secondary',
      member: 'outline',
    };

    const labels: Record<string, string> = {
      owner: 'Propietario',
      admin: 'Administrador',
      member: 'Miembro',
    };

    return (
      <Badge variant={variants[role] || 'outline'}>
        {labels[role] || role}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu organización, miembros y cuentas bancarias</p>
      </div>

      {/* Información de la Organización */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Información de la Empresa</CardTitle>
          </div>
          <CardDescription>Datos fiscales y legales de tu organización</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveOrganization} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Mi Empresa S.L."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">NIF/CIF</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
                  placeholder="Ej: B12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="ES">España</option>
                  <option value="FR">Francia</option>
                  <option value="DE">Alemania</option>
                  <option value="IT">Italia</option>
                  <option value="PT">Portugal</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Creación</Label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {organization ? format(new Date(organization.created_at), 'dd MMM yyyy', { locale: es }) : '-'}
                </div>
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Miembros del Equipo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <CardTitle>Miembros del Equipo</CardTitle>
            </div>
          </div>
          <CardDescription>Gestiona los accesos de tu equipo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lista de miembros */}
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Unido {format(new Date(member.created_at), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getRoleBadge(member.role)}
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Invitar nuevo miembro */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Invitar Nuevo Miembro</h4>
            <form onSubmit={handleInviteMember} className="flex gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@empresa.com"
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="member">Miembro</option>
                <option value="admin">Administrador</option>
              </select>
              <Button type="submit" size="icon">
                <UserPlus className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Los administradores pueden gestionar miembros y configuraciones. Los miembros solo tienen acceso de lectura.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cuentas Bancarias */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Cuentas Bancarias</CardTitle>
            </div>
            <Button onClick={handleConnectBank} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Conectar Cuenta
            </Button>
          </div>
          <CardDescription>Conecta tus cuentas bancarias para importar transacciones automáticamente</CardDescription>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay cuentas bancarias conectadas</p>
              <p className="text-xs mt-1">Conecta tu primera cuenta para comenzar a importar transacciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium capitalize">{account.provider}</p>
                        <Badge 
                          variant={account.status === 'connected' ? 'default' : account.status === 'syncing' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {account.status === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {account.status === 'syncing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          {account.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {account.status === 'connected' ? 'Conectada' : account.status === 'syncing' ? 'Sincronizando' : 'Error'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">•••• {account.iban.slice(-4)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Saldo: <span className="font-medium">{formatCurrency(account.balance)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncBank(account.id)}
                      disabled={account.status === 'syncing'}
                    >
                      Sincronizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDisconnectBank(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Tus credenciales bancarias se gestionan de forma segura a través de proveedores certificados (Plaid/GoCardless) y nunca se almacenan en nuestros servidores.
          </div>
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles para tu organización</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-md bg-red-50">
            <div>
              <p className="text-sm font-medium text-red-900">Eliminar Organización</p>
              <p className="text-xs text-red-700 mt-1">
                Esta acción eliminará todos los datos asociados permanentemente.
              </p>
            </div>
            <Button variant="destructive" disabled>
              Próximamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
