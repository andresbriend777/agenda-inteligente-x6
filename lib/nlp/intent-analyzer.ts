import type { Facts } from "../types"
import { EntityExtractor } from "./entity-extractor"

export class IntentAnalyzer {
  static async analyzeIntent(facts: Facts): Promise<string> {
    const message = facts.message.toLowerCase()
    console.log("Analizando intención del mensaje:", message)

    // Análisis mejorado para crear tablero
    if (
      message.match(/crea(?:r)?\s+(?:un\s+)?(?:nuevo\s+)?tablero/i) ||
      message.match(/nuevo\s+tablero/i) ||
      message.match(/tablero\s+(?:nuevo|llamado)/i)
    ) {
      facts.intent = "crear_tablero"
      EntityExtractor.extractTableroEntities(facts)

      // Si no se detectó un nombre específico pero la intención es crear tablero
      if (!facts.entities?.tablero_nombre) {
        // Buscar cualquier palabra después de "tablero" como posible nombre
        const nombreSimpleMatch = message.match(/tablero\s+([^\s,.]+)/i)
        if (
          nombreSimpleMatch &&
          nombreSimpleMatch[1] &&
          !["nuevo", "llamado", "que", "con"].includes(nombreSimpleMatch[1].toLowerCase())
        ) {
          facts.entities.tablero_nombre = nombreSimpleMatch[1]
        } else {
          // Asignar un nombre por defecto si no se detectó ninguno
          facts.entities.tablero_nombre = "Nuevo Tablero"
        }
      }
    }
    // Mejorar detección para eliminar tablero
    else if (
      message.match(/eliminar?\s+(?:el\s+)?tablero/i) ||
      message.match(/borrar?\s+(?:el\s+)?tablero/i) ||
      message.match(/quitar?\s+(?:el\s+)?tablero/i) ||
      message.match(/elimina\s+tablero/i) ||
      message.match(/borra\s+tablero/i)
    ) {
      facts.intent = "eliminar_tablero"
      EntityExtractor.extractTableroEntities(facts)

      // Si no se especifica un tablero y hay uno activo, usar el actual
      if (!facts.entities?.tablero_nombre && facts.boardId) {
        facts.entities.usar_tablero_actual = true
      }
    }
    // Mejorar detección para modificar tablero - AMPLIADO Y CORREGIDO
    else if (
      message.match(/cambiar?\s+(?:el\s+)?nombre\s+(?:del\s+)?tablero/i) ||
      message.match(/renombrar?\s+(?:el\s+)?tablero/i) ||
      message.match(/modificar?\s+(?:el\s+)?(?:nombre\s+del\s+)?tablero/i) ||
      message.match(/cambiar?\s+(?:el\s+)?tablero/i) ||
      message.match(/renombra\s+tablero/i) ||
      message.match(/cambia\s+(?:el\s+)?tablero/i) ||
      message.match(/modifica\s+(?:el\s+)?(?:nombre\s+(?:de\s+)?)?tablero/i) ||
      (message.includes("cambiar") && message.includes("tablero")) ||
      (message.includes("cambia") && message.includes("tablero")) ||
      (message.includes("renombrar") && message.includes("tablero")) ||
      (message.includes("renombra") && message.includes("tablero")) ||
      (message.includes("modificar") && message.includes("tablero")) ||
      (message.includes("modifica") && message.includes("tablero")) ||
      // Patrones específicos para "X por Y"
      message.match(/tablero\s+\w+\s+por\s+\w+/i) ||
      // Patrones específicos para "X a Y"
      message.match(/tablero\s+\w+\s+a\s+\w+/i)
    ) {
      facts.intent = "modificar_tablero"
      console.log("Intención detectada: modificar_tablero")
      EntityExtractor.extractTableroEntities(facts)

      // Si no se especifica un tablero y hay uno activo, usar el actual
      if (!facts.entities?.tablero_nombre_actual && facts.boardId) {
        facts.entities.usar_tablero_actual = true
      }
    }
    // Detección más robusta para crear columnas
    else if (
      message.match(/crea(?:r)?\s+(?:una\s+)?columna/i) ||
      message.match(/nueva\s+columna/i) ||
      (message.includes("columna") &&
        (message.includes("crear") || message.includes("crea") || message.includes("nueva")))
    ) {
      facts.intent = "crear_columna"
      console.log("Intención detectada: crear_columna")
      EntityExtractor.extractColumnaEntities(facts)

      // Si no se detectó un nombre específico pero la intención es crear columna
      if (!facts.entities?.columna_nombre) {
        console.log("No se detectó nombre de columna, buscando alternativas")

        // Buscar patrones comunes para nombres de columnas
        const patronesNombre = [
          /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+"([^"]+)"/i,
          /columna\s+(?:llamada|que\s+se\s+llame|con\s+(?:el\s+)?nombre(?:\s+de)?)\s+([^\s"]+)/i,
          /columna\s+([^\s,.]+)/i,
          /crear\s+columna\s+([^\s,.]+)/i,
          /crea\s+columna\s+([^\s,.]+)/i,
          /nueva\s+columna\s+([^\s,.]+)/i,
          /columna\s+llamada\s+([^\s,.]+)/i,
        ]

        for (const patron of patronesNombre) {
          const match = message.match(patron)
          if (match && match[1] && !["nueva", "llamada", "que", "con"].includes(match[1].toLowerCase())) {
            console.log(`Nombre de columna encontrado con patrón ${patron}: ${match[1]}`)
            facts.entities.columna_nombre = match[1]
            break
          }
        }

        // Si aún no se encontró un nombre, intentar extraer la última palabra después de "llamada"
        if (!facts.entities?.columna_nombre && message.includes("llamada")) {
          const palabras = message.split("llamada")[1].trim().split(/\s+/)
          if (palabras.length > 0) {
            facts.entities.columna_nombre = palabras[0]
            console.log(`Nombre de columna extraído después de "llamada": ${palabras[0]}`)
          }
        }

        // Si todavía no hay nombre, usar un valor por defecto
        if (!facts.entities?.columna_nombre) {
          facts.entities.columna_nombre = "Nueva Columna"
          console.log("Usando nombre por defecto: Nueva Columna")
        }
      }
    } else if (message.match(/eliminar\s+(?:la\s+)?columna/i)) {
      facts.intent = "eliminar_columna"
      EntityExtractor.extractColumnaEntities(facts)
    } else if (
      message.match(/cambiar\s+(?:el\s+)?nombre\s+(?:de\s+la\s+)?columna/i) ||
      message.match(/renombrar\s+(?:la\s+)?columna/i) ||
      message.match(/modificar\s+(?:la\s+)?columna/i)
    ) {
      facts.intent = "modificar_columna"
      EntityExtractor.extractColumnaEntities(facts)
    }
    // Detección mejorada para crear tareas
    else if (
      message.match(/crea(?:r)?\s+(?:una\s+)?tarea/i) ||
      message.match(/nueva\s+tarea/i) ||
      (message.includes("tarea") &&
        (message.includes("crear") || message.includes("crea") || message.includes("nueva")))
    ) {
      facts.intent = "crear_tarea"
      console.log("Intención detectada: crear_tarea")
      EntityExtractor.extractTareaEntities(facts)

      // Si no se detectó un título específico pero la intención es crear tarea
      if (!facts.entities?.tarea_titulo) {
        console.log("No se detectó título de tarea, buscando alternativas")

        // Buscar patrones comunes para títulos de tareas
        const patronesTitulo = [
          /tarea\s+(?:llamada|titulada)\s+"([^"]+)"/i,
          /tarea\s+(?:llamada|titulada)\s+([^\s,.]+(?:\s+[^\s,.]+)*?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /crear\s+tarea\s+"([^"]+)"/i,
          /crear\s+tarea\s+([^\s,.]+(?:\s+[^\s,.]+)*?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /crea\s+tarea\s+"([^"]+)"/i,
          /crea\s+tarea\s+([^\s,.]+(?:\s+[^\s,.]+)*?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
          /nueva\s+tarea\s+"([^"]+)"/i,
          /nueva\s+tarea\s+([^\s,.]+(?:\s+[^\s,.]+)*?)(?:\s+en\s+|\s+con\s+|\s*$)/i,
        ]

        for (const patron of patronesTitulo) {
          const match = message.match(patron)
          if (match && match[1] && !["nueva", "llamada", "que", "con", "en"].includes(match[1].toLowerCase())) {
            console.log(`Título de tarea encontrado con patrón ${patron}: ${match[1]}`)
            facts.entities.tarea_titulo = match[1]
            break
          }
        }

        // Si todavía no hay título, usar un valor por defecto
        if (!facts.entities?.tarea_titulo) {
          facts.entities.tarea_titulo = "Nueva Tarea"
          console.log("Usando título por defecto: Nueva Tarea")
        }
      }
    }
    // Detección mejorada para eliminar tareas
    else if (
      message.match(/eliminar\s+(?:la\s+)?tarea/i) ||
      message.match(/borrar\s+(?:la\s+)?tarea/i) ||
      message.match(/quitar\s+(?:la\s+)?tarea/i) ||
      (message.includes("elimina") && message.includes("tarea")) ||
      (message.includes("borra") && message.includes("tarea"))
    ) {
      facts.intent = "eliminar_tarea"
      console.log("Intención detectada: eliminar_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }
    // Detección mejorada para modificar tareas
    else if (
      message.match(/cambiar\s+(?:el\s+)?(?:nombre|título)\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/renombrar\s+(?:la\s+)?tarea/i) ||
      message.match(/modificar\s+(?:la\s+)?tarea/i) ||
      message.match(/cambiar\s+(?:la\s+)?descripción\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/editar\s+(?:la\s+)?tarea/i) ||
      message.match(/actualizar\s+(?:la\s+)?tarea/i) ||
      (message.includes("cambiar") && message.includes("tarea")) ||
      (message.includes("renombrar") && message.includes("tarea")) ||
      (message.includes("modificar") && message.includes("tarea")) ||
      (message.includes("editar") && message.includes("tarea")) ||
      (message.includes("actualizar") && message.includes("tarea"))
    ) {
      facts.intent = "modificar_tarea"
      console.log("Intención detectada: modificar_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }
    // Detección mejorada para cambiar prioridad
    else if (
      message.match(/cambiar\s+(?:la\s+)?prioridad/i) ||
      message.match(/establecer\s+(?:la\s+)?prioridad/i) ||
      message.match(/prioridad\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/poner\s+(?:la\s+)?tarea\s+(?:como|en)\s+prioridad/i) ||
      message.match(/asignar\s+prioridad/i) ||
      (message.includes("prioridad") && message.includes("tarea"))
    ) {
      facts.intent = "cambiar_prioridad"
      console.log("Intención detectada: cambiar_prioridad")
      EntityExtractor.extractTareaEntities(facts)
    }
    // Detección mejorada para cambiar fecha
    else if (
      message.match(/cambiar\s+(?:la\s+)?fecha/i) ||
      message.match(/establecer\s+(?:la\s+)?fecha/i) ||
      message.match(/poner\s+(?:la\s+)?fecha/i) ||
      message.match(/asignar\s+(?:la\s+)?fecha/i) ||
      message.match(/fecha\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/vencimiento\s+(?:de\s+la\s+)?tarea/i) ||
      message.match(/tarea\s+(?:para|vence)(?:\s+el)?\s+/i) ||
      (message.includes("fecha") && (message.includes("tarea") || message.includes("para"))) ||
      (message.includes("vence") && message.includes("tarea")) ||
      (message.includes("para") &&
        (message.includes("hoy") ||
          message.includes("mañana") ||
          message.includes("manana") ||
          message.includes("próximo") ||
          message.includes("proximo") ||
          message.match(/\d{1,2}\/\d{1,2}\/\d{4}/) ||
          message.match(/\d{4}-\d{1,2}-\d{1,2}/)))
    ) {
      facts.intent = "cambiar_fecha"
      console.log("Intención detectada: cambiar_fecha")
      EntityExtractor.extractTareaEntities(facts)

      // Si no se detectó un título específico pero la intención es cambiar fecha
      if (!facts.entities?.tarea_titulo) {
        console.log("No se detectó título de tarea para cambio de fecha, buscando alternativas")

        // Patrones para encontrar el título de la tarea en comandos de cambio de fecha
        const patronesTituloTarea = [
          /tarea\s+"([^"]+)"\s+(?:para|vence|fecha)/i,
          /tarea\s+([^"]+?)\s+(?:para|vence|fecha)/i,
          /(?:fecha|vencimiento)\s+(?:de\s+)?(?:la\s+)?tarea\s+"([^"]+)"/i,
          /(?:fecha|vencimiento)\s+(?:de\s+)?(?:la\s+)?tarea\s+([^"]+?)(?:\s+(?:para|a|en)|$)/i,
        ]

        for (const patron of patronesTituloTarea) {
          const match = message.match(patron)
          if (match && match[1]) {
            facts.entities = facts.entities || {}
            facts.entities.tarea_titulo = match[1].trim()
            console.log(`Título de tarea para cambio de fecha encontrado: "${facts.entities.tarea_titulo}"`)
            break
          }
        }
      }
    }
    // Detección mejorada para gestionar miembros
    else if (
      message.match(/asigna(?:r)?\s+miembros/i) ||
      message.match(/añad(?:ir|e)\s+miembros/i) ||
      message.match(/agrega(?:r)?\s+miembros/i) ||
      message.match(/quita(?:r)?\s+miembros/i) ||
      message.match(/elimina(?:r)?\s+miembros/i) ||
      message.match(/remueve\s+miembros/i) ||
      message.includes("miembros") ||
      (message.includes("asignar") && message.includes("a") && message.includes("tarea")) ||
      (message.includes("añadir") && message.includes("a") && message.includes("tarea")) ||
      (message.includes("agregar") && message.includes("a") && message.includes("tarea")) ||
      (message.includes("quitar") && message.includes("de") && message.includes("tarea")) ||
      (message.includes("eliminar") && message.includes("de") && message.includes("tarea"))
    ) {
      facts.intent = "gestionar_miembros"
      console.log("Intención detectada: gestionar_miembros")
      facts.entities = facts.entities || {}

      // Establecer acción por defecto si no se especifica
      if (
        message.includes("asigna") ||
        message.includes("añad") ||
        message.includes("agrega") ||
        message.includes("asignar") ||
        message.includes("añadir") ||
        message.includes("agregar")
      ) {
        facts.entities.accion_miembro = "asignar"
      } else if (
        message.includes("quita") ||
        message.includes("elimina") ||
        message.includes("remueve") ||
        message.includes("quitar") ||
        message.includes("eliminar") ||
        message.includes("remover")
      ) {
        facts.entities.accion_miembro = "quitar"
      } else {
        facts.entities.accion_miembro = "asignar" // Por defecto
      }

      console.log("Acción de miembros establecida:", facts.entities.accion_miembro)
      EntityExtractor.extractTareaEntities(facts)
    }
    // Detección mejorada para mover tareas
    else if (
      message.match(/mover\s+(?:la\s+)?tarea/i) ||
      message.match(/cambiar\s+(?:la\s+)?tarea\s+de\s+columna/i) ||
      message.match(/pasar\s+(?:la\s+)?tarea/i) ||
      message.match(/trasladar\s+(?:la\s+)?tarea/i) ||
      (message.includes("mover") && message.includes("tarea")) ||
      (message.includes("cambiar") && message.includes("columna") && message.includes("tarea")) ||
      (message.includes("pasar") &&
        message.includes("tarea") &&
        (message.includes("a") || message.includes("hacia"))) ||
      (message.includes("trasladar") && message.includes("tarea"))
    ) {
      facts.intent = "mover_tarea"
      console.log("Intención detectada: mover_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }
    // Detección mejorada para completar tareas
    else if (
      message.match(/(?:completar|finalizar|terminar)\s+(?:la\s+)?tarea/i) ||
      message.match(/marcar\s+(?:la\s+)?tarea\s+(?:como\s+)?(?:completada|finalizada|terminada)/i) ||
      message.match(/(?:la\s+)?tarea\s+(?:está|esta)\s+(?:completada|finalizada|terminada)/i) ||
      message.match(/(?:la\s+)?tarea\s+(?:se\s+)?(?:completó|completo|finalizó|finalizo|terminó|termino)/i) ||
      (message.includes("completar") && message.includes("tarea")) ||
      (message.includes("finalizar") && message.includes("tarea")) ||
      (message.includes("terminar") && message.includes("tarea")) ||
      (message.includes("completada") && message.includes("tarea")) ||
      (message.includes("finalizada") && message.includes("tarea")) ||
      (message.includes("terminada") && message.includes("tarea"))
    ) {
      facts.intent = "completar_tarea"
      console.log("Intención detectada: completar_tarea")
      EntityExtractor.extractTareaEntities(facts)
    }

    // Si no se detectó ninguna intención específica
    if (!facts.intent) {
      facts.intent = "desconocido"
    }

    console.log("Intención detectada:", facts.intent)
    console.log("Entidades extraídas:", facts.entities)

    return facts.intent
  }

  static getHelpMessage(facts: Facts): string {
    if (facts.boardId) {
      // Si está en un tablero
      return `No entendí lo que quieres hacer. Aquí hay algunas cosas que puedes pedirme:
      
- Crear una columna: "Crea una columna llamada Pendientes"
- Eliminar una columna: "Elimina la columna Pendientes"
- Crear una tarea: "Crea una tarea llamada Estudiar Física"
- Crear una tarea en columna específica: "Crea una tarea Estudiar Física en la columna Pendientes"
- Modificar una tarea: "Cambia el título de la tarea Estudiar a Estudiar Matemáticas"
- Cambiar prioridad: "Establece la prioridad de Estudiar Física a Alta"
- Cambiar fecha: "Establece la fecha de la tarea Estudiar Física para mañana"
- Asignar miembros: "Asigna miembros Juan, María a la tarea Estudiar Física"
- Mover una tarea: "Mueve la tarea Estudiar Física a la columna En Progreso"
- Completar una tarea: "Marca como completada la tarea Estudiar Física"
- Cambiar nombre del tablero: "Cambia el nombre del tablero a Nuevo Nombre"
- Eliminar tablero: "Elimina este tablero"`
    } else {
      // Si está en la página principal
      return `No entendí lo que quieres hacer. Aquí hay algunas cosas que puedes pedirme:
      
- Crear un tablero: "Crea un tablero llamado Proyecto Escolar"
- Eliminar un tablero: "Elimina el tablero Proyecto Escolar"
- Modificar un tablero: "Cambia el nombre del tablero Proyecto a Proyecto Escolar"`
    }
  }
}
