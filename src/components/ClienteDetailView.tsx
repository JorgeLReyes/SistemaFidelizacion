import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Phone, Calendar, Award, ShoppingBag, 
  Plus, Edit3, RotateCcw, Filter, Trash2, Check, X,
  ExternalLink, Sparkles, TrendingUp, HelpCircle
} from 'lucide-react';
import { ClienteData, MovimientoData, MovimientoTipo, ClassType, UniversidadData, ConfiguracionPuntos } from '../types';

interface ClienteDetailViewProps {
  cliente: ClienteData;
  clientes: ClienteData[];
  universidades: UniversidadData[];
  config: ConfiguracionPuntos;
  movimientos: MovimientoData[];
  onBack: () => void;
  onUpdateClienteInfo: (id: string, updates: Partial<ClienteData>) => Promise<void>;
  onAddMovimiento: (mov: Omit<MovimientoData, 'id'>) => Promise<void>;
  onDeleteMovimiento: (id: string) => Promise<void>;
  onUpdateMovimiento: (id: string, updates: Partial<MovimientoData>) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
}

export function ClienteDetailView({
  cliente,
  clientes,
  universidades,
  config,
  movimientos,
  onBack,
  onUpdateClienteInfo,
  onAddMovimiento,
  onDeleteMovimiento,
  onUpdateMovimiento,
  onDeleteCliente
}: ClienteDetailViewProps) {
  
  // Local state for modals and forms
  const [activeModal, setActiveModal] = useState<'compra' | 'canje' | 'ajuste' | 'edit-info' | 'edit-mov' | 'reset-puntos' | 'confirm-undo' | 'delete-cliente' | null>(null);
  
  // Forms states
  const [basicNombre, setBasicNombre] = useState(cliente.nombre);
  const [basicTelefono, setBasicTelefono] = useState(cliente.telefono);
  const [basicClasificacion, setBasicClasificacion] = useState<ClassType>(cliente.clasificacion);
  const [basicUniversidad, setBasicUniversidad] = useState(cliente.universidad || '');

  // Compra modal states (inside client view, client is preselected)
  const [newCompraMonto, setNewCompraMonto] = useState<string>('');
  const [newCompraTicket, setNewCompraTicket] = useState<string>('');

  // Canje modal states
  const [canjePuntos, setCanjePuntos] = useState<string>('');
  const [canjeConcepto, setCanjeConcepto] = useState<string>('');

  // Ajuste modal states
  const [ajustePuntos, setAjustePuntos] = useState<string>('');
  const [ajusteTipo, setAjusteTipo] = useState<'sumar' | 'restar'>('sumar');
  const [ajusteJustificacion, setAjusteJustificacion] = useState<string>('');

  // Edit movement modal state
  const [selectedMov, setSelectedMov] = useState<MovimientoData | null>(null);
  const [editMovPuntos, setEditMovPuntos] = useState<string>('');
  const [editMovMonto, setEditMovMonto] = useState<string>('');
  const [editMovTicket, setEditMovTicket] = useState<string>('');
  const [editMovConcepto, setEditMovConcepto] = useState<string>('');

  // Sandbox-safe replacement modal states to bypass prompt/confirm blockages
  const [motivoReseteo, setMotivoReseteo] = useState<string>('');
  const [selectedUndoReseteoMov, setSelectedUndoReseteoMov] = useState<MovimientoData | null>(null);
  const [confirmingDeleteMov, setConfirmingDeleteMov] = useState<boolean>(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('');

  // Filters for local list
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'ganados' | 'canjeados'>('todos');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Chart / month selector state
  const [selectedMesAno, setSelectedMesAno] = useState<string>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  const [uiError, setUiError] = useState<string>('');
  const [uiSuccess, setUiSuccess] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmCompraCheck, setConfirmCompraCheck] = useState(false);
  const [confirmCanjeCheck, setConfirmCanjeCheck] = useState(false);
  const [confirmAjusteCheck, setConfirmAjusteCheck] = useState(false);

  // Reset checkboxes and modalError states on modal changes
  useEffect(() => {
    setConfirmCompraCheck(false);
    setConfirmCanjeCheck(false);
    setConfirmAjusteCheck(false);
    setMotivoAnulacion('');
    setModalError('');
  }, [activeModal]);

  // Sync internal copy if client props update
  useEffect(() => {
    setBasicNombre(cliente.nombre);
    setBasicTelefono(cliente.telefono);
    setBasicClasificacion(cliente.clasificacion);
    setBasicUniversidad(cliente.universidad || '');
  }, [cliente]);

  // Set message helper
  const notify = (msg: string, isError = false) => {
    if (isError) {
      if (activeModal) {
        setModalError(msg);
        setTimeout(() => setModalError(''), 5500);
      } else {
        setUiError(msg);
        setTimeout(() => setUiError(''), 4050);
      }
    } else {
      setUiSuccess(msg);
      setTimeout(() => setUiSuccess(''), 4050);
    }
  };

  // 1. Basic Info Updater
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    const formatNombre = (str: string): string => {
      return str
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => {
          if (!word) return '';
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    };

    const formatTelefono = (str: string): string => {
      return str.replace(/\s+/g, '');
    };

    const cleanNombre = formatNombre(basicNombre);
    if (!cleanNombre) {
      notify('El nombre es obligatorio.', true);
      return;
    }

    // Duplicate telephone check
    const cleanTelefono = formatTelefono(basicTelefono);
    if (cleanTelefono) {
      const cleanTarget = cleanTelefono.replace(/[-\s()]/g, '');
      const isDuplicate = clientes.some(c => c.id !== cliente.id && (c.telefono || '').replace(/[-\s()]/g, '') === cleanTarget);
      if (isDuplicate) {
        notify('El número de teléfono ya está registrado por otro cliente.', true);
        return;
      }
    }

    try {
      await onUpdateClienteInfo(cliente.id, {
        nombre: cleanNombre,
        telefono: cleanTelefono,
        clasificacion: basicClasificacion,
        universidad: basicClasificacion === 'estudiante' ? basicUniversidad : ''
      });
      notify('Información básica actualizada correctamente.');
      setActiveModal(null);
    } catch (err: any) {
      notify('Error: ' + err.message, true);
    }
  };

  // 2. Add purchase directement on this client
  const handleAddCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const numMonto = parseFloat(newCompraMonto) || 0;
    if (numMonto <= 0) {
      notify('Por favor ingresa un monto válido mayor a 0 pesos.', true);
      return;
    }

    if (!confirmCompraCheck) {
      notify('Por favor confirma la acción marcando la casilla de confirmación.', true);
      return;
    }
    
    const puntosCalculados = Math.floor(numMonto / config.pesosPorPunto);
    setIsSubmitting(true);
    try {
      // 1. Register transaction movement
      await onAddMovimiento({
        clienteId: cliente.id,
        tipo: 'compra',
        puntos: puntosCalculados,
        fecha: new Date().toISOString(),
        monto: numMonto,
        ticketNo: newCompraTicket.trim() || undefined,
        anteriorPuntos: cliente.puntos
      });

      // 2. Update client totals
      await onUpdateClienteInfo(cliente.id, {
        puntos: cliente.puntos + puntosCalculados
      });

      notify(`¡Compra registrada! Ganó +${puntosCalculados} puntos.`);
      setNewCompraMonto('');
      setNewCompraTicket('');
      setActiveModal(null);
    } catch (err: any) {
      notify('Error al registrar compra: ' + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Canjear puntos handler
  const handleCanjearPuntos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const ptsToRedeem = parseInt(canjePuntos) || 0;
    if (ptsToRedeem <= 0) {
      notify('Por favor ingresa una cantidad de puntos válida mayor que 0.', true);
      return;
    }
    if (ptsToRedeem > cliente.puntos) {
      notify(`Puntos insuficientes. El cliente solo tiene ${cliente.puntos} puntos disponibles.`, true);
      return;
    }

    if (!confirmCanjeCheck) {
      notify('Por favor confirma la acción marcando la casilla de confirmación.', true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert canje movement
      await onAddMovimiento({
        clienteId: cliente.id,
        tipo: 'canje',
        puntos: -ptsToRedeem,
        fecha: new Date().toISOString(),
        concepto: canjeConcepto.trim() || 'Canje de puntos acumulados',
        anteriorPuntos: cliente.puntos
      });

      // Adjust client points
      await onUpdateClienteInfo(cliente.id, {
        puntos: cliente.puntos - ptsToRedeem
      });

      notify(`Canje exitoso de ${ptsToRedeem} puntos.`);
      setCanjePuntos('');
      setCanjeConcepto('');
      setActiveModal(null);
    } catch (err: any) {
      notify('Error: ' + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Ajustar puntos manual (Increase/Decrease)
  const handleAjustarPuntos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const pts = parseInt(ajustePuntos) || 0;
    if (pts <= 0) {
      notify('Por favor ingresa una cantidad de puntos válida superior a 0.', true);
      return;
    }
    if (!ajusteJustificacion.trim()) {
      notify('Por favor escribe un motivo o justificación para el ajuste.', true);
      return;
    }

    if (!confirmAjusteCheck) {
      notify('Por favor confirma la acción marcando la casilla de confirmación.', true);
      return;
    }

    const multiplier = ajusteTipo === 'sumar' ? 1 : -1;
    const finalPtsChange = pts * multiplier;
    const targetPoints = cliente.puntos + finalPtsChange;

    if (targetPoints < 0) {
      notify('No se puede realizar un ajuste que deje al cliente con puntos negativos.', true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddMovimiento({
        clienteId: cliente.id,
        tipo: 'ajuste',
        puntos: finalPtsChange,
        fecha: new Date().toISOString(),
        concepto: ajusteJustificacion.trim(),
        anteriorPuntos: cliente.puntos
      });

      await onUpdateClienteInfo(cliente.id, {
        puntos: targetPoints
      });

      notify(`Ajuste de puntos aplicado correctamente (${finalPtsChange >= 0 ? '+' : ''}${finalPtsChange} pts).`);
      setAjustePuntos('');
      setAjusteJustificacion('');
      setActiveModal(null);
    } catch (err: any) {
      notify('Error: ' + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Resetear puntos (To 0 with undo capability)
  const handleResetearPuntos = () => {
    if (cliente.puntos === 0) {
      notify('El cliente ya tiene 0 puntos.', true);
      return;
    }
    setMotivoReseteo('');
    setActiveModal('reset-puntos');
  };

  const handleConfirmResetearPuntos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoReseteo.trim()) {
      notify('El motivo es requerido para resetear los puntos.', true);
      return;
    }

    try {
      const puntosAntes = cliente.puntos;
      await onAddMovimiento({
        clienteId: cliente.id,
        tipo: 'reseteo',
        puntos: -puntosAntes,
        fecha: new Date().toISOString(),
        concepto: `Reseteo: ${motivoReseteo.trim()}`,
        anteriorPuntos: puntosAntes
      });

      await onUpdateClienteInfo(cliente.id, {
        puntos: 0
      });

      notify('Colección de puntos reseteada a 0 correctamente.');
      setMotivoReseteo('');
      setActiveModal(null);
    } catch (err: any) {
      notify('Error en reseteo: ' + err.message, true);
    }
  };

  // 5b. Permanent client delete handler
  const handleDeleteClienteConfirmed = async () => {
    try {
      await onDeleteCliente(cliente.id);
      notify('Cliente eliminado de forma permanente.');
      setActiveModal(null);
      onBack();
    } catch (err: any) {
      setModalError('No se pudo eliminar el cliente: ' + err.message);
    }
  };

  // 6. Annul movement and reverse calculations on parent and databases
  const handleDeleteMovAndReverse = async (m: MovimientoData) => {
    // Show inline warning in modal
    setConfirmingDeleteMov(true);
  };

  const handleDeleteMovAndReverseConfirmed = async (m: MovimientoData) => {
    if (!motivoAnulacion.trim()) {
      notify('Por favor, ingresa el motivo de la anulación.', true);
      return;
    }
    try {
      // Calculate reverse points
      let newPts = cliente.puntos - m.puntos;
      if (newPts < 0) newPts = 0; // Guard

      let extraUpdates: Partial<ClienteData> = { puntos: newPts };

      // Update movement to annulled instead of deleting it
      await onUpdateMovimiento(m.id, {
        anulado: true,
        fechaAnulado: new Date().toISOString(),
        motivoAnulado: motivoAnulacion.trim()
      });
      await onUpdateClienteInfo(cliente.id, extraUpdates);
      
      notify('Movimiento anulado e historial revertido correctamente.');
      setConfirmingDeleteMov(false);
      setActiveModal(null);
      setSelectedMov(null);
    } catch (err: any) {
      notify('No se pudo anular movimiento: ' + err.message, true);
    }
  };

  // 7. Modificar Movimiento Submission
  const handleSaveEditMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMov) return;

    try {
      if (selectedMov.tipo === 'compra') {
        const numNewMonto = parseFloat(editMovMonto) || 0;
        const numNewPuntos = parseInt(editMovPuntos) || 0;

        if (numNewMonto <= 0) {
          notify('El monto debe ser mayor a 0.', true);
          return;
        }

        // Difference in points for the client
        const pointDiff = numNewPuntos - selectedMov.puntos;
        const targetPts = cliente.puntos + pointDiff;

        if (targetPts < 0) {
          notify('Esta modificación resulta en un balance de puntos negativo para el cliente.', true);
          return;
        }

        await onUpdateMovimiento(selectedMov.id, {
          monto: numNewMonto,
          puntos: numNewPuntos,
          ticketNo: editMovTicket.trim() || undefined
        });

        await onUpdateClienteInfo(cliente.id, {
          puntos: targetPts
        });

        notify('Movimiento de compra modificado y puntos recalculados.');

      } else if (selectedMov.tipo === 'canje') {
        const numNewPuntos = parseInt(editMovPuntos) || 0; // as a absolute number (positive) but we store negative
        const realNewPuntosVal = -Math.abs(numNewPuntos);

        const pointDiff = realNewPuntosVal - selectedMov.puntos;
        const targetPts = cliente.puntos + pointDiff;

        if (targetPts < 0) {
          notify(`Esta modificación excede los puntos disponibles del cliente. Puntos máximos posibles: ${cliente.puntos - selectedMov.puntos}.`, true);
          return;
        }

        await onUpdateMovimiento(selectedMov.id, {
          puntos: realNewPuntosVal,
          concepto: editMovConcepto.trim() || 'Modificación de canje'
        });

        await onUpdateClienteInfo(cliente.id, {
          puntos: targetPts
        });

        notify('Canje modificado exitosamente.');

      } else if (selectedMov.tipo === 'ajuste') {
        const numNewPuntos = parseInt(editMovPuntos) || 0; // points can be negative or positive depending on original adjustment sign
        
        const pointDiff = numNewPuntos - selectedMov.puntos;
        const targetPts = cliente.puntos + pointDiff;

        if (targetPts < 0) {
          notify('Esta modificación resulta en un balance de puntos negativo para el cliente.', true);
          return;
        }

        await onUpdateMovimiento(selectedMov.id, {
          puntos: numNewPuntos,
          concepto: editMovConcepto.trim()
        });

        await onUpdateClienteInfo(cliente.id, {
          puntos: targetPts
        });

        notify('Ajuste de puntos modificado y balance re-nivelado.');
      }

      setActiveModal(null);
      setSelectedMov(null);
    } catch (err: any) {
      notify('Error al modificar movimiento: ' + err.message, true);
    }
  };

  // Undo reseteo directly!
  const handleUndoReseteo = (reseteoMov: MovimientoData) => {
    setSelectedUndoReseteoMov(reseteoMov);
    setActiveModal('confirm-undo');
  };

  const handleConfirmUndoReseteo = async () => {
    if (!selectedUndoReseteoMov) return;
    try {
      const restorePointsNum = Math.abs(selectedUndoReseteoMov.puntos); // e.g. if we reset -1200 points, restore is positive 1200
      await onUpdateClienteInfo(cliente.id, {
        puntos: cliente.puntos + restorePointsNum
      });
      // Mark reseteo as annulled instead of deleting it
      await onUpdateMovimiento(selectedUndoReseteoMov.id, {
        anulado: true,
        fechaAnulado: new Date().toISOString(),
        motivoAnulado: 'Reseteo deshecho por el operador'
      });
      notify(`Puntos restaurados: +${restorePointsNum} pts devueltos.`);
      setSelectedUndoReseteoMov(null);
      setActiveModal(null);
    } catch (err: any) {
      notify('No se pudo deshacer reseteo: ' + err.message, true);
    }
  };

  // 8. Open Modification dialogue
  const handleOpenEditMov = (m: MovimientoData) => {
    setSelectedMov(m);
    setEditMovPuntos(Math.abs(m.puntos).toString());
    setEditMovMonto(m.monto ? m.monto.toString() : '');
    setEditMovTicket(m.ticketNo || '');
    setEditMovConcepto(m.concepto || '');
    setActiveModal('edit-mov');
  };

  // 9. Filters applications
  const filteredMovimientos = movimientos
    .filter(m => m.clienteId === cliente.id)
    .filter(m => {
      // Tipo filter
      if (tipoFiltro === 'ganados') return m.puntos > 0;
      if (tipoFiltro === 'canjeados') return m.puntos < 0;
      return true;
    })
    .filter(m => {
      // Range filter
      if (fechaDesde) {
        const mDate = m.fecha.substring(0, 10);
        if (mDate < fechaDesde) return false;
      }
      if (fechaHasta) {
        const mDate = m.fecha.substring(0, 10);
        if (mDate > fechaHasta) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // 10. Historical calculation of points / purchases filtered by Month/Year Selector
  const purchaseStatsForActiveMonthYear = React.useMemo(() => {
    const selectedYrMo = selectedMesAno; // e.g. "2026-06"
    
    const relevantMovs = movimientos.filter(m => 
      m.clienteId === cliente.id && 
      m.fecha.startsWith(selectedYrMo) &&
      !m.anulado
    );

    const checkCompras = relevantMovs.filter(m => m.tipo === 'compra');
    const totalPesosComp = checkCompras.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    const totalPtsEarnedInPeriod = checkCompras.reduce((acc, curr) => acc + curr.puntos, 0);

    const checkCanjes = relevantMovs.filter(m => m.tipo === 'canje');
    const ptsRedeemedInPeriod = Math.abs(checkCanjes.reduce((acc, curr) => acc + curr.puntos, 0));

    return {
      comprasCount: checkCompras.length,
      comprasSumPesos: totalPesosComp,
      puntosGanados: totalPtsEarnedInPeriod,
      puntosCanjeados: ptsRedeemedInPeriod
    };
  }, [movimientos, cliente.id, selectedMesAno]);

  // 10b. Lifetime total stats and current month stats for cards
  const totalStats = React.useMemo(() => {
    const clientMovs = movimientos.filter(m => m.clienteId === cliente.id && !m.anulado);
    
    // Total (Lifetime)
    const purchases = clientMovs.filter(m => m.tipo === 'compra');
    const totalPesos = purchases.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    const totalPtsEarned = purchases.reduce((acc, curr) => acc + curr.puntos, 0);

    const canjes = clientMovs.filter(m => m.tipo === 'canje');
    const totalPtsRedeemed = Math.abs(canjes.reduce((acc, curr) => acc + curr.puntos, 0));

    // Mes actual (Current Month)
    const currentYrMo = new Date().toISOString().substring(0, 7); // e.g. "2026-06"
    const currentMonthMovs = clientMovs.filter(m => m.fecha.startsWith(currentYrMo));
    
    const currentMonthPurchases = currentMonthMovs.filter(m => m.tipo === 'compra');
    const currentMonthPesos = currentMonthPurchases.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    const currentMonthPtsEarned = currentMonthPurchases.reduce((acc, curr) => acc + curr.puntos, 0);

    const currentMonthCanjes = currentMonthMovs.filter(m => m.tipo === 'canje');
    const currentMonthPtsRedeemed = Math.abs(currentMonthCanjes.reduce((acc, curr) => acc + curr.puntos, 0));

    return {
      totalPesos,
      totalPtsEarned,
      totalPtsRedeemed,
      totalPurchasesCount: purchases.length,
      currentMonthPesos,
      currentMonthPtsEarned,
      currentMonthPtsRedeemed,
      currentMonthPurchasesCount: currentMonthPurchases.length
    };
  }, [movimientos, cliente.id]);

  // Find the single absolute most recent active (non-annulled) movement for this client
  const mostRecentActiveMov = React.useMemo(() => {
    const activeMovs = movimientos.filter(m => m.clienteId === cliente.id && !m.anulado);
    if (activeMovs.length === 0) return null;
    return [...activeMovs].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
  }, [movimientos, cliente.id]);

  // Style tags helpers
  const badgeColors = {
    normal: 'bg-slate-100 text-slate-700 border-slate-200/80',
    doctor: 'bg-blue-50 text-blue-800 border-blue-100',
    estudiante: 'bg-violet-50 text-violet-800 border-violet-100'
  };

  const badgeLabels = {
    normal: 'Cliente Regular',
    doctor: 'Doctor / Especialista',
    estudiante: cliente.universidad ? `Estud. (${cliente.universidad})` : 'Estudiante'
  };

  // Convert points to cash
  const equivalents = (cliente.puntos * config.valorPuntoEnPesos).toFixed(2);

  // Formatter for humans
  const formatHumanDate = (isoStr?: string) => {
    if (!isoStr) return 'Reciente';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Alert banner notifications */}
      {uiError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-rose-50 text-rose-800 border-2 border-rose-100 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[9999] flex items-center gap-2 animate-bounce">
          <span>{uiError}</span>
        </div>
      )}
      {uiSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-50 text-emerald-800 border-2 border-emerald-100 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[9999] flex items-center gap-2">
          <span>{uiSuccess}</span>
        </div>
      )}

      {/* Profile Header Block */}
      <div className="bg-white rounded-3xl border border-slate-205/65 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-5">
        
        {/* Navigation row and title */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-905 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Regresar</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('edit-info')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 transition shadow-sm active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Editar información</span>
            </button>

            <button
              onClick={() => setActiveModal('delete-cliente')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/50 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 animate-fadeIn"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-450" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        {/* Client general profile specs card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4">
            
            {/* Initials block */}
            <div className="w-16 h-16 rounded-2xl bg-gray-950 text-white flex items-center justify-center font-black text-xl tracking-wider shadow-inner shrink-0 scale-100 animate-fadeIn select-none uppercase">
              {cliente.nombre.trim().slice(0,2)}
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                {cliente.nombre}
              </h1>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border leading-tight ${badgeColors[cliente.clasificacion]}`}>
                  {badgeLabels[cliente.clasificacion]}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  ID: #{cliente.id.substring(0, 8)}
                </span>
              </div>
            </div>

          </div>

          {/* Points Big counter */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-right sm:min-w-[170px] select-all">
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Points Balance</span>
            <div className="font-mono text-3xl font-black text-emerald-850 leading-none">
              {cliente.puntos} <span className="text-sm font-sans font-bold text-emerald-600/80">pts</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold italic mt-1.5 block leading-none">
              Equivale a <strong className="font-extrabold text-slate-900">${equivalents} MXN</strong>
            </span>
          </div>

        </div>

        {/* Phone / Registered dates metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
            <Phone className="w-4 h-4 text-slate-405 shrink-0" />
            <div>
              <span className="text-[9px] block uppercase font-bold text-slate-400">Teléfono / Celular</span>
              <span className="font-bold font-mono text-slate-800">{cliente.telefono || 'No proporcionado'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-405 shrink-0" />
            <div>
              <span className="text-[9px] block uppercase font-bold text-slate-400">Miembro desde</span>
              <span className="font-bold text-slate-800">{formatHumanDate(cliente.fechaRegistro)}</span>
            </div>
          </div>
        </div>

        {/* Action Triggers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          
          <button
            onClick={() => setActiveModal('compra')}
            className="flex flex-col items-center justify-center p-3.5 bg-black text-white rounded-2xl shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mb-1 text-emerald-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">Añadir Compra</span>
          </button>

          <button
            onClick={() => setActiveModal('canje')}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition shadow-md active:scale-95"
          >
            <Award className="w-4 h-4 mb-1 text-emerald-100" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">Canjear Puntos</span>
          </button>

          <button
            onClick={() => setActiveModal('ajuste')}
            className="flex flex-col items-center justify-center p-3.5 bg-slate-105 hover:bg-slate-200 text-slate-850 rounded-2xl border border-slate-200 transition shadow-sm active:scale-95"
          >
            <TrendingUp className="w-4 h-4 mb-1 text-slate-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">Ajustar Puntos</span>
          </button>

          <button
            onClick={handleResetearPuntos}
            className="flex flex-col items-center justify-center p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl border border-rose-100 transition shadow-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4 mb-1 text-rose-450 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">Resetear Puntos</span>
          </button>

        </div>

      </div>

      {/* Middle: Resumen de Compras / Selector de Mes y Año */}
      <div className="bg-white rounded-3xl border border-slate-205/65 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-slate-900" />
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-tight">
              Análisis y Resumen de Compras
            </h3>
          </div>
          
          {/* Year/Month selection dropdown to check specific dates */}
          <div className="flex items-center gap-1.5 self-start">
            <span className="text-[10px] font-bold uppercase text-slate-400">Ver periodo:</span>
            <input
              type="month"
              value={selectedMesAno}
              onChange={(e) => setSelectedMesAno(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {/* Global Statistics VS Period Statistics block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Compras (Total)</span>
            <span className="text-lg font-mono font-black text-slate-900">{totalStats.totalPurchasesCount}</span>
            <span className="text-[8.5px] font-semibold text-slate-600 block mt-0.5">monto: ${totalStats.totalPesos.toFixed(0)}</span>
            <span className="text-[8.5px] font-medium text-slate-400 block">puntos: +{totalStats.totalPtsEarned}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Compras (Mes act.)</span>
            <span className="text-lg font-mono font-black text-slate-900">{totalStats.currentMonthPurchasesCount}</span>
            <span className="text-[8.5px] font-semibold text-slate-650 block mt-0.5">monto: ${totalStats.currentMonthPesos.toFixed(0)}</span>
            <span className="text-[8.5px] font-medium text-slate-400 block">puntos: +{totalStats.currentMonthPtsEarned}</span>
          </div>

          {/* Period specific numbers */}
          <div className="p-3 bg-blue-50/50 rounded-xl text-center border border-blue-50">
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide block">Compras periodo</span>
            <span className="text-lg font-mono font-black text-blue-900">{purchaseStatsForActiveMonthYear.comprasCount}</span>
            <span className="text-[8.5px] font-semibold text-blue-700 block mt-0.5">monto: ${purchaseStatsForActiveMonthYear.comprasSumPesos.toFixed(0)}</span>
          </div>

          <div className="p-3 bg-emerald-50/40 rounded-xl text-center border border-emerald-50/50">
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide block">Puntos periodo</span>
            <span className="text-lg font-mono font-black text-emerald-900">+{purchaseStatsForActiveMonthYear.puntosGanados}</span>
            <span className="text-[8.5px] font-semibold text-rose-600 block mt-0.5">canjeados: {purchaseStatsForActiveMonthYear.puntosCanjeados}</span>
          </div>

        </div>
      </div>

      {/* Bottom: Transaction History & Filtros de Fechas */}
      <div className="bg-white rounded-3xl border border-slate-205/65 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-4">
        
        {/* Title & History configuration filters */}
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-900" />
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-tight">
              Historial de Movimientos
            </h3>
          </div>

          {/* Type filters and date limits selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            
            {/* Filter buttons selector */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTipoFiltro('todos')}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition ${
                  tipoFiltro === 'todos' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTipoFiltro('ganados')}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition ${
                  tipoFiltro === 'ganados' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Ganados
              </button>
              <button
                onClick={() => setTipoFiltro('canjeados')}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition ${
                  tipoFiltro === 'canjeados' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Canjeados
              </button>
            </div>

            {/* Date range filters */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={fechaDesde}
                title="Fecha desde"
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none w-full"
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                value={fechaHasta}
                title="Fecha hasta"
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none w-full"
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md"
                  title="Limpiar fechas"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Transactions list */}
        <div className="divide-y divide-slate-100 min-h-36 max-h-[500px] overflow-y-auto pr-1">
          {filteredMovimientos.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium italic">
              No hay movimientos registrados para este cliente que coincidan con los filtros.
            </div>
          ) : (
            filteredMovimientos.map((m) => {
              const dateObj = new Date(m.fecha);
              const fmtDate = dateObj.toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              const isPositive = m.puntos > 0;
              const isAnnulled = m.anulado === true;

              return (
                <div 
                  key={m.id} 
                  className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group hover:bg-slate-50/40 px-2 rounded-2xl transition-all border-b border-dashed border-slate-100 ${
                    isAnnulled ? 'opacity-70 bg-slate-50/40' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    
                    {/* Top Row: Type tag & Concept / Ticket */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[8.5px] font-[900] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        isAnnulled ? 'bg-slate-200 text-slate-500' :
                        m.tipo === 'compra' ? 'bg-indigo-50 text-indigo-700' :
                        m.tipo === 'canje' ? 'bg-rose-50 text-rose-700' :
                        m.tipo === 'reseteo' ? 'bg-red-50 text-red-700 border border-red-200/50' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {m.tipo}
                      </span>
                      
                      {isAnnulled && (
                        <span className="text-[8.2px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider shadow-sm select-none">
                          Anulado
                        </span>
                      )}
                      
                      {m.tipo === 'compra' && (
                        <span className={`text-xs truncate ${isAnnulled ? 'line-through text-slate-400 decoration-slate-400 font-medium' : 'font-extrabold text-slate-900'}`}>
                          Compra {m.ticketNo ? `#${m.ticketNo}` : '(Sin folio)'}
                        </span>
                      )}

                      {m.tipo !== 'compra' && (
                        <span className={`text-xs truncate ${isAnnulled ? 'line-through text-slate-400 decoration-slate-400 font-medium' : 'font-bold text-slate-800'}`}>
                          {m.concepto || 'Operación manual'}
                        </span>
                      )}
                    </div>

                    {/* Secondary row metadata info */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium">
                      <span>{fmtDate}</span>
                      
                      {m.tipo === 'compra' && m.monto && (
                        <span className={`font-bold font-mono ${isAnnulled ? 'line-through text-slate-350' : 'text-slate-600'}`}>
                          Monto: ${m.monto.toFixed(2)}
                        </span>
                      )}

                      {m.tipo === 'canje' && (
                        <span className={`font-bold font-mono ${isAnnulled ? 'line-through text-slate-350' : 'text-slate-500'}`}>
                          Valor canjeado: ${(Math.abs(m.puntos) * config.valorPuntoEnPesos).toFixed(2)} pesos
                        </span>
                      )}
                      
                      {m.anteriorPuntos !== undefined && (
                        <span className="font-mono text-[9px] text-slate-400/95 bg-slate-50 px-1.5 py-0.5 rounded">
                          Ant: {m.anteriorPuntos} pts
                        </span>
                      )}

                      {isAnnulled && m.motivoAnulado && (
                        <span className="text-rose-700 font-bold bg-rose-50 border border-rose-100/80 px-2 py-0.5 rounded-md text-[9px] truncate max-w-xs" title={m.motivoAnulado}>
                          Motivo: {m.motivoAnulado}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Right side: points indicator and action keys */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t border-dashed border-slate-100/70 sm:border-t-0">
                    <span className="sm:hidden text-[9px] font-[900] text-slate-400 uppercase tracking-widest">Puntos y acción</span>
                    
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-black px-2 py-1 rounded-lg ${
                        isAnnulled ? 'bg-slate-100 text-slate-400 line-through decoration-slate-400/70' :
                        isPositive ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50/50 text-rose-800'
                      }`}>
                        {isPositive ? '+' : ''}{m.puntos} pts
                      </span>

                      {/* Special Undo for Reseteo OR details/edit keys for others */}
                      {isAnnulled ? (
                        <span className="px-2.5 py-1.5 bg-slate-100/70 text-slate-450 border border-slate-200/50 text-[9px] font-extrabold uppercase tracking-wider rounded-lg select-none">
                          Inalterable
                        </span>
                      ) : m.tipo === 'reseteo' ? (
                        <button
                          onClick={() => handleUndoReseteo(m)}
                          className="px-3 py-1.5 bg-red-105 hover:bg-red-200 text-red-800 text-[10px] font-black uppercase tracking-wider rounded-lg transition"
                          title="Deshacer reseteo de puntos"
                        >
                          Deshacer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenEditMov(m)}
                          className="p-1 px-[11px] py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold uppercase rounded-lg transition"
                        >
                          Modificar
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ========================================================
         POPUP ACTIONS & FORMS MODALS (rendered dynamically)
         ======================================================== */}

      {/* 1. Modal: Basic details modify */}
      {activeModal === 'edit-info' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleSaveBasicInfo} className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Editar Datos Básicos</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre del Cliente *</label>
                <input type="text" value={basicNombre} onChange={(e) => setBasicNombre(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teléfono / Celular</label>
                <input type="text" value={basicTelefono} onChange={(e) => setBasicTelefono(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clasificación *</label>
                <select value={basicClasificacion} onChange={(e) => setBasicClasificacion(e.target.value as ClassType)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold">
                  <option value="normal">Cliente Normal</option>
                  <option value="doctor">Doc / Especialista</option>
                  <option value="estudiante">Estudiante</option>
                </select>
              </div>

              {basicClasificacion === 'estudiante' && (
                <div className="space-y-1 bg-violet-50 p-2.5 rounded-xl border border-violet-100">
                  <label className="text-[9px] font-extrabold text-violet-600 uppercase block">Universidad de procedencia *</label>
                  <select value={basicUniversidad} onChange={(e) => setBasicUniversidad(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-violet-100 rounded-lg text-xs" required>
                    <option value="">-- Selecciona Escuela --</option>
                    {universidades.map(u => (
                      <option key={u.id} value={u.nombre}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-[10px] font-bold text-left animate-fadeIn">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-slate-100 text-slate-550 rounded-xl text-xs font-bold font-sans">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-slate-950 text-white hover:bg-slate-850 rounded-xl text-xs font-bold">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Modal: Registrar Compra (Client View) */}
      {activeModal === 'compra' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleAddCompra} className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Agregar Compra a este Cliente</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-950 text-white flex items-center justify-center text-xs font-bold">{cliente.nombre.slice(0,1)}</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{cliente.nombre}</p>
                  <p className="text-[10px] text-slate-400">Puntos actuales: {cliente.puntos} pts</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ticket / Folio de Compra</label>
                <input type="text" value={newCompraTicket} onChange={(e) => setNewCompraTicket(e.target.value)} placeholder="Ej. T-1025" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto total ($MXN) *</label>
                <input type="number" step="any" value={newCompraMonto} onChange={(e) => setNewCompraMonto(e.target.value)} placeholder="Ej. 120" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" required />
              </div>

              {parseFloat(newCompraMonto) > 0 && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-[10px] text-emerald-800 font-semibold border border-emerald-100">
                    Añadirá <strong className="font-black">+{Math.floor(parseFloat(newCompraMonto) / config.pesosPorPunto)} puntos</strong> al balance de {cliente.nombre}.
                  </div>

                  <label className="flex items-start gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border rounded-xl cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={confirmCompraCheck}
                      onChange={(e) => setConfirmCompraCheck(e.target.checked)}
                      disabled={isSubmitting}
                      className="w-4 h-4 mt-0.5 rounded text-slate-950 border-slate-300 focus:ring-slate-950 accent-slate-950"
                    />
                    <span className="text-[10px] font-bold text-slate-700 leading-snug">
                      Quiero registrar esta compra de ${parseFloat(newCompraMonto).toFixed(2)}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-[10px] font-bold text-left animate-fadeIn">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setActiveModal(null)} disabled={isSubmitting} className="px-3 py-1.5 hover:bg-slate-100 text-slate-550 rounded-xl text-xs font-bold font-sans">Cancelar</button>
              <button 
                type="submit" 
                disabled={isSubmitting || parseFloat(newCompraMonto) <= 0 || !confirmCompraCheck}
                className="px-4 py-1.5 bg-gray-950 text-white hover:bg-gray-850 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Modal: Canjear points accum */}
      {activeModal === 'canje' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleCanjearPuntos} className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Canjear / Redimir Puntos</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                <span className="text-[9px] font-bold text-emerald-600 uppercase block">Puntos Disponibles</span>
                <span className="text-xl font-mono font-black text-emerald-800">{cliente.puntos} pts</span>
                <span className="block text-[10px] text-emerald-705">Equivale a: <strong className="font-extrabold">${(cliente.puntos * config.valorPuntoEnPesos).toFixed(2)} pesos</strong></span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos a Canjear *</label>
                <input 
                  type="number" 
                  value={canjePuntos} 
                  onChange={(e) => setCanjePuntos(e.target.value)} 
                  max={cliente.puntos}
                  placeholder={`Máximo ${cliente.puntos}`} 
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" 
                  required 
                />
              </div>

              {parseInt(canjePuntos) > 0 && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-rose-50/50 text-rose-800 border border-rose-100 rounded-xl text-[10px] font-semibold">
                    Se canjearán {parseInt(canjePuntos)} puntos por un valor de <strong className="font-black text-slate-900">${(parseInt(canjePuntos) * config.valorPuntoEnPesos).toFixed(2)} pesos</strong> en descuento directo.
                  </div>

                  <label className="flex items-start gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border rounded-xl cursor-pointer select-none transition-colors animate-fadeIn">
                    <input
                      type="checkbox"
                      checked={confirmCanjeCheck}
                      onChange={(e) => setConfirmCanjeCheck(e.target.checked)}
                      disabled={isSubmitting}
                      className="w-4 h-4 mt-0.5 rounded text-slate-950 border-slate-300 focus:ring-slate-950 accent-slate-950"
                    />
                    <span className="text-[10px] font-bold text-slate-700 leading-snug">
                      Quiero realizar este canje por ${(parseInt(canjePuntos) * config.valorPuntoEnPesos).toFixed(2)} pesos
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Concepto / Descripción (opcional)</label>
                <input type="text" value={canjeConcepto} onChange={(e) => setCanjeConcepto(e.target.value)} placeholder="Ej. Descuento en montura de lentes" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" />
              </div>

              {parseInt(canjePuntos) > cliente.puntos && (
                <div className="p-3 bg-rose-55 text-rose-800 border-2 border-rose-100 rounded-xl text-[10px] font-bold animate-fadeIn">
                  ¡Puntos insuficientes! El cliente sólo cuenta con {cliente.puntos} puntos disponibles. Por favor introduce un valor menor o igual.
                </div>
              )}
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-[10px] font-bold text-left animate-fadeIn">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setActiveModal(null)} disabled={isSubmitting} className="px-3 py-1.5 hover:bg-slate-100 text-slate-550 rounded-xl text-xs font-bold font-sans">Cancelar</button>
              <button 
                type="submit" 
                disabled={isSubmitting || !canjePuntos || parseInt(canjePuntos) <= 0 || parseInt(canjePuntos) > cliente.puntos || !confirmCanjeCheck} 
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Canje'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Modal: Ajustar Manual */}
      {activeModal === 'ajuste' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleAjustarPuntos} className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Ajuste de Puntos Manual</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                Puntos actuales de referencia: <strong className="text-slate-900">{cliente.puntos} pts</strong>
              </div>

              {/* Increasement / Decreasement toggle */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Tipo de Ajuste *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAjusteTipo('sumar')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      ajusteTipo === 'sumar' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Incrementar (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAjusteTipo('restar')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      ajusteTipo === 'restar' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Decrementar (-)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Cantidad de Puntos *</label>
                <input type="number" value={ajustePuntos} onChange={(e) => setAjustePuntos(e.target.value)} placeholder="Ej. 150" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Motivo / Justificación *</label>
                <textarea value={ajusteJustificacion} onChange={(e) => setAjusteJustificacion(e.target.value)} rows={2} placeholder="Explica detalladamente por qué aplicas este ajuste..." className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none resize-none" required />
              </div>

              {parseInt(ajustePuntos) > 0 && ajusteJustificacion.trim().length > 0 && (
                <label className="flex items-start gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border rounded-xl cursor-pointer select-none transition-colors animate-fadeIn">
                  <input
                    type="checkbox"
                    checked={confirmAjusteCheck}
                    onChange={(e) => setConfirmAjusteCheck(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 mt-0.5 rounded text-slate-950 border-slate-300 focus:ring-slate-950 accent-slate-950 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-[10px] font-bold text-slate-700 leading-snug">
                    Quiero aplicar este ajuste de {ajusteTipo === 'sumar' ? '+' : '-'}{parseInt(ajustePuntos)} pts
                  </span>
                </label>
              )}
              {ajusteTipo === 'restar' && parseInt(ajustePuntos) > cliente.puntos && (
                <div className="p-3 bg-rose-50 text-rose-800 border-2 border-rose-100 rounded-xl text-[10px] font-bold animate-fadeIn">
                  ¡Puntos insuficientes! El decremento ({ajustePuntos} pts) supera los puntos disponibles del cliente ({cliente.puntos} pts), lo cual dejaría la cuenta en saldo negativo.
                </div>
              )}
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-[10px] font-bold text-left animate-fadeIn">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setActiveModal(null)} disabled={isSubmitting} className="px-3 py-1.5 hover:bg-slate-100 text-slate-550 rounded-xl text-xs font-bold font-sans">Cancelar</button>
              <button 
                type="submit" 
                disabled={isSubmitting || !ajustePuntos || parseInt(ajustePuntos) <= 0 || !ajusteJustificacion.trim() || !confirmAjusteCheck || (ajusteTipo === 'restar' && parseInt(ajustePuntos) > cliente.puntos)} 
                className="px-4 py-1.5 bg-slate-950 text-white hover:bg-slate-850 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Aplicando...' : 'Aplicar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Modal: Modificar / Editar Movimientos Existentes */}
      {activeModal === 'edit-mov' && selectedMov && (() => {
        const isSelectedMovLatestActive = !selectedMov.anulado && mostRecentActiveMov && selectedMov.id === mostRecentActiveMov.id;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="absolute inset-0" onClick={() => { setActiveModal(null); setConfirmingDeleteMov(false); }} />
            <form onSubmit={handleSaveEditMovimiento} className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn">
              
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  {!isSelectedMovLatestActive ? `Detalles del Movimiento (${selectedMov.tipo})` : confirmingDeleteMov ? 'Confirmar Anulación' : `Modificar Movimiento (${selectedMov.tipo})`}
                </h3>
                <button type="button" onClick={() => { setActiveModal(null); setConfirmingDeleteMov(false); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              {confirmingDeleteMov ? (
                <div className="space-y-4 py-3 text-center">
                  <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <Trash2 className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">¿Estás seguro de anular este movimiento?</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Esta transacción se mantendrá en el historial marcada como <strong className="font-extrabold text-rose-600">anulada</strong>, y se revertirán automáticamente sus puntos correspondientes del balance del cliente.
                  </p>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Escribe el Motivo de Anulación *</label>
                    <textarea 
                      value={motivoAnulacion}
                      onChange={(e) => setMotivoAnulacion(e.target.value)}
                      placeholder="Ej. Error en cantidad ingresada, folio cancelado, devolución..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded-xl text-xs font-semibold outline-none resize-none"
                      rows={2.5}
                      required
                    />
                  </div>

                  {modalError && (
                    <div className="p-2 bg-rose-50 text-rose-850 border border-rose-100 rounded-lg text-[9px] font-extrabold text-left leading-tight">
                      {modalError}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteMovAndReverseConfirmed(selectedMov)}
                      disabled={!motivoAnulacion.trim()}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                      Sí, confirmar anulación
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteMov(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Cancelar y regresar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {!isSelectedMovLatestActive && (
                      <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[10px] leading-relaxed font-semibold">
                        ⚠️ <strong>Historial Bloqueado:</strong> No puedes modificar ni anular este movimiento porque se han registrado movimientos más recientes. Solo el último movimiento activo del cliente puede ser modificado o anulado.
                      </div>
                    )}

                    {selectedMov.tipo === 'compra' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Folio o Referencia</label>
                          <input type="text" value={editMovTicket} onChange={(e) => setEditMovTicket(e.target.value)} disabled={!isSelectedMovLatestActive} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold font-mono disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none" />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Monto de la Compra ($MXN) *</label>
                          <input 
                            type="number" 
                            step="any"
                            value={editMovMonto} 
                            onChange={(e) => {
                              setEditMovMonto(e.target.value);
                              const val = parseFloat(e.target.value) || 0;
                              setEditMovPuntos(Math.floor(val / config.pesosPorPunto).toString());
                            }} 
                            disabled={!isSelectedMovLatestActive}
                            className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none" 
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Puntos Calculados *</label>
                          <input type="number" value={editMovPuntos} onChange={(e) => setEditMovPuntos(e.target.value)} disabled={!isSelectedMovLatestActive} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold font-mono disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none" required />
                        </div>
                      </>
                    )}

                    {selectedMov.tipo === 'canje' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Puntos Canjeados *</label>
                          <input type="number" value={editMovPuntos} onChange={(e) => setEditMovPuntos(e.target.value)} disabled={!isSelectedMovLatestActive} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none" required />
                          <p className="text-[10px] text-slate-450 italic">
                            Equivale a una compensación de: ${(parseFloat(editMovPuntos || '0') * config.valorPuntoEnPesos).toFixed(2)} pesos MN.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Descripción del canje</label>
                          <input type="text" value={editMovConcepto} onChange={(e) => setEditMovConcepto(e.target.value)} disabled={!isSelectedMovLatestActive} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none" />
                        </div>
                      </>
                    )}

                    {selectedMov.tipo === 'ajuste' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Puntos del Ajuste *</label>
                          <input type="number" value={editMovPuntos} onChange={(e) => setEditMovPuntos(e.target.value)} disabled={!isSelectedMovLatestActive} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none" required />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block">Justificación</label>
                          <textarea value={editMovConcepto} onChange={(e) => setEditMovConcepto(e.target.value)} disabled={!isSelectedMovLatestActive} rows={3} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold resize-none disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none" required />
                        </div>
                      </>
                    )}
                  </div>

                  {modalError && (
                    <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-[10px] font-bold text-left animate-fadeIn mb-2">
                      {modalError}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t">
                    {isSelectedMovLatestActive ? (
                      <>
                        {/* Annul transaction safely */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMovAndReverse(selectedMov)}
                          className="px-3 py-1.5 text-rose-650 hover:bg-rose-50 rounded-xl text-xs font-black transition flex items-center gap-1 shrink-0 uppercase tracking-tight cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Anular Movimiento</span>
                        </button>

                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer">Regresar</button>
                          <button type="submit" className="px-4 py-1.5 bg-slate-950 text-white hover:bg-slate-850 rounded-xl text-xs font-bold font-sans cursor-pointer transition">Actualizar</button>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-end w-full">
                        <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-1.5 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition">
                          Cerrar detalles
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

            </form>
          </div>
        );
      })()}

      {/* 6. Modal: Resetear Puntos (Iframe-safe replacement) */}
      {activeModal === 'reset-puntos' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleConfirmResetearPuntos} className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn">
            
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-rose-700 uppercase tracking-tight flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-500 font-bold" />
                <span>Resetear Puntos a 0</span>
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-950 text-[11px] font-medium space-y-1 border border-rose-100">
                <p className="font-bold">¿Deseas resetear los puntos de {cliente.nombre}?</p>
                <p className="text-[10px] text-rose-700 leading-normal">
                  Esta acción registrará un movimiento de cancelación por los <strong className="font-extrabold">{cliente.puntos} pts</strong> actuales, dejando el saldo del cliente en 0. Podrás revertir esta acción de manera inmediata deshaciendo el movimiento de reseteo en el historial.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Motivo o Justificación del Reseteo *</label>
                <textarea 
                  value={motivoReseteo} 
                  onChange={(e) => setMotivoReseteo(e.target.value)} 
                  rows={3} 
                  placeholder="Por favor, escribe el motivo o causa del reseteo de puntos..." 
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none resize-none focus:bg-white" 
                  required 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm">
                Confirmar Reseteo
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 7. Modal: Deshacer Reseteo (Iframe-safe replacement) */}
      {activeModal === 'confirm-undo' && selectedUndoReseteoMov && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={() => { setActiveModal(null); setSelectedUndoReseteoMov(null); }} />
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn text-center">
            
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-1">
              <RotateCcw className="w-5 h-5 animate-spin" />
            </div>

            <h3 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider">Restaurar Puntos Anteriores</h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              ¿Deseas deshacer este reseteo y devolverle al cliente sus <strong className="font-extrabold text-slate-800">{Math.abs(selectedUndoReseteoMov.puntos)} puntos</strong> anteriores?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmUndoReseteo}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Sí, restaurar puntos
              </button>
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedUndoReseteoMov(null); }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Regresar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. Modal: Eliminar Cliente (Confirmation Modal) */}
      {activeModal === 'delete-cliente' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 p-5 space-y-4 shadow-2xl animate-fadeIn text-center">
            
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-1">
              <Trash2 className="w-5 h-5 animate-bounce" />
            </div>

            <h3 className="text-xs font-black text-rose-950 uppercase tracking-widest">¿Eliminar Cliente Permanentemente?</h3>
            
            <div className="p-3 bg-rose-50/50 rounded-xl text-rose-950 text-[11px] font-medium space-y-2 border border-rose-100 text-left">
              <p className="font-bold">Cliente: <span className="font-extrabold text-rose-700">{cliente.nombre}</span></p>
              <p className="text-[10px] text-rose-700 leading-normal font-semibold">
                Esta acción es <strong className="font-extrabold text-rose-800">completamente irreversible</strong>. Se eliminará de forma permanente al cliente y todas sus referencias de la base de datos.
              </p>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-[10px] font-bold text-left animate-fadeIn">
                {modalError}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteClienteConfirmed}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm uppercase tracking-wide cursor-pointer"
              >
                Sí, eliminar cliente definitivamente
              </button>
              <button
                type="button"
                onClick={() => { setActiveModal(null); setModalError(''); }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar y regresar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
