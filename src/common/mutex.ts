/**
 * Cola de ejecución en memoria. Al ser un único servidor (monolito), alcanza
 * para serializar operaciones de lectura-modificación-escritura sobre un envío
 * (asignar / cambiar estado) y evitar condiciones de carrera.
 * Si algún día se escala a varios servidores, esto se reemplaza por bloqueo en la base.
 */
export class Mutex {
  private cola: Promise<unknown> = Promise.resolve();

  ejecutar<T>(fn: () => Promise<T>): Promise<T> {
    const resultado = this.cola.then(() => fn());
    this.cola = resultado.catch(() => undefined);
    return resultado;
  }
}
