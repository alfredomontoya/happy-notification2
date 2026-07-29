import {Persona} from '../database/types';

export type FiltroFecha = 'todos' | 'hoy' | 'semana' | 'mes' | `mes-${number}`;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function nombreMes(n: number): string {
  return MESES[n - 1] ?? '';
}

export function getCalendarWeek(): {lunes: Date; domingo: Date} {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(hoy);
  lunes.setDate(lunes.getDate() + diffLunes);
  lunes.setHours(0, 0, 0, 0);

  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  return {lunes, domingo};
}

function formatFecha(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}

export function getResultMessage(filtro: FiltroFecha, count: number): string {
  const s = count === 1 ? '' : 's';
  const prefix = `${count} resultado${s}`;

  switch (filtro) {
    case 'todos':
      return `Todos los cumpleañeros — ${prefix}`;
    case 'hoy':
      return `Cumpleañeros de Hoy — ${prefix}`;
    case 'semana': {
      const {lunes, domingo} = getCalendarWeek();
      return `Cumpleañeros de la semana del ${formatFecha(lunes)} al ${formatFecha(domingo)} — ${prefix}`;
    }
    case 'mes': {
      const mes = new Date().getMonth() + 1;
      return `Cumpleañeros del mes de ${nombreMes(mes)} — ${prefix}`;
    }
    default: {
      if (filtro.startsWith('mes-')) {
        const n = parseInt(filtro.split('-')[1], 10);
        return `Cumpleañeros del mes de ${nombreMes(n)} — ${prefix}`;
      }
      return prefix;
    }
  }
}

export function filtrarPersonas(
  personas: Persona[],
  query: string,
  filtroFecha: FiltroFecha,
): Persona[] {
  let result = personas;

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      p =>
        p.nombre.toLowerCase().includes(q) ||
        p.ci.toLowerCase().includes(q),
    );
  }

  if (filtroFecha && filtroFecha !== 'todos') {
    const hoy = new Date();

    result = result.filter(p => {
      const fn = new Date(p.fecha_nacimiento);

      switch (filtroFecha) {
        case 'hoy':
          return (
            fn.getUTCMonth() === hoy.getUTCMonth() &&
            fn.getUTCDate() === hoy.getUTCDate()
          );

        case 'semana': {
          const {lunes, domingo} = getCalendarWeek();

          const cumple = new Date(fn);
          cumple.setUTCFullYear(lunes.getUTCFullYear());

          if (cumple.getTime() >= lunes.getTime() && cumple.getTime() <= domingo.getTime()) return true;

          cumple.setUTCFullYear(lunes.getUTCFullYear() + 1);
          return cumple.getTime() >= lunes.getTime() && cumple.getTime() <= domingo.getTime();
        }

        case 'mes':
          return fn.getUTCMonth() === hoy.getUTCMonth();

        default: {
          if (filtroFecha.startsWith('mes-')) {
            const n = parseInt(filtroFecha.split('-')[1], 10);
            return fn.getUTCMonth() === n - 1;
          }
          return true;
        }
      }
    });
  }

  return result;
}

export function getCumpleanerosHoy(personas: Persona[]): Persona[] {
  const hoy = new Date();
  return personas.filter(p => {
    const fn = new Date(p.fecha_nacimiento);
    return (
      fn.getUTCMonth() === hoy.getUTCMonth() &&
      fn.getUTCDate() === hoy.getUTCDate()
    );
  });
}