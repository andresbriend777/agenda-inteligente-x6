import { getCollection, convertToObjectId } from "../db"
import type { Rule, Facts, ActionResult, TaskData, UpdateData } from "../types"
import { DateParser } from "../utils/date-parser"

// Reglas relacionadas con tareas
export const taskRules: Rule[] = [
  // R7: Crear una tarea - MEJORADO
  {
    id: "R7",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R7 (crear tarea):", facts)
      return (
        (facts.intent === "crear_tarea" ||
          (facts.message.toLowerCase().includes("crea") && facts.message.toLowerCase().includes("tarea"))) &&
        facts.entities?.tarea_titulo &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para crear tarea:", facts.entities)

      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo crear la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const columnsCollection = await getCollection("columns")
      const tasksCollection = await getCollection("tasks")

      // Determinar la columna donde crear la tarea - MEJORADO
      let columnQuery = {}
      if (facts.entities.columna_nombre) {
        // Si se especificó una columna - búsqueda insensible a mayúsculas/minúsculas
        console.log("Buscando columna específica:", facts.entities.columna_nombre)
        columnQuery = {
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        }
      } else {
        // Por defecto, usar la primera columna (Haciendo)
        console.log("Usando columna por defecto: Haciendo")
        columnQuery = {
          name: { $regex: /^Haciendo$/i },
          boardId: convertToObjectId(facts.boardId),
        }
      }

      const column = await columnsCollection.findOne(columnQuery)

      if (!column) {
        console.log("No se encontró la columna:", columnQuery)

        // Si no se encontró la columna específica, intentar buscar cualquier columna que contenga el nombre
        if (facts.entities.columna_nombre) {
          const columnPartialMatch = await columnsCollection.findOne({
            name: { $regex: new RegExp(facts.entities.columna_nombre, "i") },
            boardId: convertToObjectId(facts.boardId),
          })

          if (columnPartialMatch) {
            console.log("Se encontró columna por coincidencia parcial:", columnPartialMatch.name)
            // Usar esta columna en su lugar
            const result = await createTaskInColumn(facts, tasksCollection, columnPartialMatch)
            return result
          }

          return {
            success: false,
            message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Si no se especificó columna y no se encontró la columna por defecto, buscar cualquier columna
        const anyColumn = await columnsCollection.findOne({
          boardId: convertToObjectId(facts.boardId),
        })

        if (anyColumn) {
          console.log("Usando primera columna disponible:", anyColumn.name)
          const result = await createTaskInColumn(facts, tasksCollection, anyColumn)
          return result
        }

        return {
          success: false,
          message: "No se encontró ninguna columna en este tablero.",
          actionTaken: false,
        }
      }

      console.log("Columna encontrada:", column.name)

      // Crear la tarea en la columna encontrada
      const result = await createTaskInColumn(facts, tasksCollection, column)
      return result
    },
    priority: 8,
  },

  // R8: Eliminar una tarea - MEJORADO
  {
    id: "R8",
    condition: (facts: Facts) => {
      return facts.intent === "eliminar_tarea" && facts.entities?.tarea_titulo && facts.boardId
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo eliminar la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Construir la consulta para buscar la tarea
      const taskQuery: any = {
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      }

      // Si se especificó una columna, añadirla a la consulta
      if (facts.entities.columna_nombre) {
        // Primero buscar la columna por nombre
        const column = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!column) {
          return {
            success: false,
            message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Añadir el ID de la columna a la consulta
        taskQuery.columnId = column._id
      }

      // Buscar la tarea
      const task = await tasksCollection.findOne(taskQuery)

      if (!task) {
        // Si no se encontró con título exacto, intentar con búsqueda parcial
        const taskPartialMatch = await tasksCollection.findOne({
          title: { $regex: new RegExp(facts.entities.tarea_titulo, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!taskPartialMatch) {
          const mensaje = facts.entities.columna_nombre
            ? `No se encontró la tarea "${facts.entities.tarea_titulo}" en la columna "${facts.entities.columna_nombre}".`
            : `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`

          return {
            success: false,
            message: mensaje,
            actionTaken: false,
          }
        }

        // Usar la tarea encontrada por coincidencia parcial
        const deleteResult = await tasksCollection.deleteOne({ _id: taskPartialMatch._id })

        if (deleteResult.deletedCount === 1) {
          // Obtener el nombre de la columna para el mensaje
          const column = await columnsCollection.findOne({ _id: taskPartialMatch.columnId })
          const columnName = column ? column.name : "desconocida"

          return {
            success: true,
            message: `Tarea "${taskPartialMatch.title}" eliminada con éxito de la columna "${columnName}".`,
            actionTaken: true,
          }
        }
      } else {
        // Eliminar la tarea encontrada
        const deleteResult = await tasksCollection.deleteOne({ _id: task._id })

        if (deleteResult.deletedCount === 1) {
          // Obtener el nombre de la columna para el mensaje
          const column = await columnsCollection.findOne({ _id: task.columnId })
          const columnName = column ? column.name : "desconocida"

          return {
            success: true,
            message: `Tarea "${task.title}" eliminada con éxito de la columna "${columnName}".`,
            actionTaken: true,
          }
        }
      }

      return {
        success: false,
        message: "No se pudo eliminar la tarea.",
        actionTaken: false,
      }
    },
    priority: 8,
  },

  // R9: Modificar título o descripción de una tarea - MEJORADO
  {
    id: "R9",
    condition: (facts: Facts) => {
      return (
        facts.intent === "modificar_tarea" &&
        facts.entities?.tarea_titulo_actual &&
        (facts.entities?.tarea_titulo_nuevo || facts.entities?.tarea_descripcion) &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo modificar la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Construir la consulta para buscar la tarea
      const taskQuery: any = {
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo_actual}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      }

      // Si se especificó una columna, añadirla a la consulta
      if (facts.entities.columna_nombre) {
        // Primero buscar la columna por nombre
        const column = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!column) {
          return {
            success: false,
            message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Añadir el ID de la columna a la consulta
        taskQuery.columnId = column._id
      }

      const updateData: UpdateData = { updatedAt: new Date() }

      if (facts.entities.tarea_titulo_nuevo) {
        updateData.title = facts.entities.tarea_titulo_nuevo
      }

      if (facts.entities.tarea_descripcion) {
        updateData.description = facts.entities.tarea_descripcion
      }

      // Buscar y actualizar la tarea
      const task = await tasksCollection.findOne(taskQuery)

      if (!task) {
        // Si no se encontró con título exacto, intentar con búsqueda parcial
        const taskPartialMatch = await tasksCollection.findOne({
          title: { $regex: new RegExp(facts.entities.tarea_titulo_actual, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!taskPartialMatch) {
          const mensaje = facts.entities.columna_nombre
            ? `No se encontró la tarea "${facts.entities.tarea_titulo_actual}" en la columna "${facts.entities.columna_nombre}".`
            : `No se encontró la tarea "${facts.entities.tarea_titulo_actual}" en este tablero.`

          return {
            success: false,
            message: mensaje,
            actionTaken: false,
          }
        }

        // Actualizar la tarea encontrada por coincidencia parcial
        const updateResult = await tasksCollection.updateOne({ _id: taskPartialMatch._id }, { $set: updateData })

        if (updateResult.matchedCount === 1) {
          let message = "Tarea actualizada con éxito."
          if (facts.entities.tarea_titulo_nuevo) {
            message = `Título de la tarea actualizado de "${taskPartialMatch.title}" a "${facts.entities.tarea_titulo_nuevo}".`
          } else if (facts.entities.tarea_descripcion) {
            message = `Descripción de la tarea "${taskPartialMatch.title}" actualizada.`
          }

          return {
            success: true,
            message,
            actionTaken: true,
          }
        }
      } else {
        // Actualizar la tarea encontrada
        const updateResult = await tasksCollection.updateOne({ _id: task._id }, { $set: updateData })

        if (updateResult.matchedCount === 1) {
          let message = "Tarea actualizada con éxito."
          if (facts.entities.tarea_titulo_nuevo) {
            message = `Título de la tarea actualizado de "${task.title}" a "${facts.entities.tarea_titulo_nuevo}".`
          } else if (facts.entities.tarea_descripcion) {
            message = `Descripción de la tarea "${task.title}" actualizada.`
          }

          return {
            success: true,
            message,
            actionTaken: true,
          }
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar la tarea.",
        actionTaken: false,
      }
    },
    priority: 7,
  },

  // R10: Cambiar prioridad de una tarea - MEJORADO
  {
    id: "R10",
    condition: (facts: Facts) => {
      return (
        facts.intent === "cambiar_prioridad" &&
        facts.entities?.tarea_titulo &&
        facts.entities?.tarea_prioridad &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo cambiar la prioridad de la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Normalizar la prioridad
      let priority = facts.entities.tarea_prioridad.toLowerCase()
      if (priority === "alta" || priority === "high") {
        priority = "Alta"
      } else if (priority === "media" || priority === "medium") {
        priority = "Media"
      } else if (priority === "baja" || priority === "low") {
        priority = "Baja"
      } else {
        priority = "Media" // Valor por defecto
      }

      // Construir la consulta para buscar la tarea
      const taskQuery: any = {
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      }

      // Si se especificó una columna, añadirla a la consulta
      if (facts.entities.columna_nombre) {
        // Primero buscar la columna por nombre
        const column = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!column) {
          return {
            success: false,
            message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Añadir el ID de la columna a la consulta
        taskQuery.columnId = column._id
      }

      // Buscar la tarea
      const task = await tasksCollection.findOne(taskQuery)

      if (!task) {
        // Si no se encontró con título exacto, intentar con búsqueda parcial
        const taskPartialMatch = await tasksCollection.findOne({
          title: { $regex: new RegExp(facts.entities.tarea_titulo, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!taskPartialMatch) {
          const mensaje = facts.entities.columna_nombre
            ? `No se encontró la tarea "${facts.entities.tarea_titulo}" en la columna "${facts.entities.columna_nombre}".`
            : `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`

          return {
            success: false,
            message: mensaje,
            actionTaken: false,
          }
        }

        // Actualizar la tarea encontrada por coincidencia parcial
        const updateResult = await tasksCollection.updateOne(
          { _id: taskPartialMatch._id },
          {
            $set: {
              priority,
              updatedAt: new Date(),
            },
          },
        )

        if (updateResult.matchedCount === 1) {
          return {
            success: true,
            message: `Prioridad de la tarea "${taskPartialMatch.title}" actualizada a "${priority}".`,
            actionTaken: true,
          }
        }
      } else {
        // Actualizar la tarea encontrada
        const updateResult = await tasksCollection.updateOne(
          { _id: task._id },
          {
            $set: {
              priority,
              updatedAt: new Date(),
            },
          },
        )

        if (updateResult.matchedCount === 1) {
          return {
            success: true,
            message: `Prioridad de la tarea "${task.title}" actualizada a "${priority}".`,
            actionTaken: true,
          }
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar la prioridad de la tarea.",
        actionTaken: false,
      }
    },
    priority: 7,
  },

  // R11: Cambiar fecha de vencimiento de una tarea - MEJORADO
  {
    id: "R11",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R11 (cambiar fecha):", facts)
      return (
        facts.intent === "cambiar_fecha" && facts.entities?.tarea_titulo && facts.entities?.tarea_fecha && facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para cambiar fecha:", facts.entities)

      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo cambiar la fecha de la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Construir la consulta para buscar la tarea
      const taskQuery: any = {
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      }

      // Si se especificó una columna, añadirla a la consulta
      if (facts.entities.columna_nombre) {
        // Primero buscar la columna por nombre
        const column = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!column) {
          return {
            success: false,
            message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Añadir el ID de la columna a la consulta
        taskQuery.columnId = column._id
      }

      // Buscar la tarea
      console.log("Buscando tarea:", taskQuery)
      const task = await tasksCollection.findOne(taskQuery)

      if (!task) {
        console.log("No se encontró la tarea con búsqueda exacta")

        // Si no se encontró con título exacto, intentar con búsqueda parcial
        const taskPartialMatch = await tasksCollection.findOne({
          title: { $regex: new RegExp(facts.entities.tarea_titulo, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!taskPartialMatch) {
          const mensaje = facts.entities.columna_nombre
            ? `No se encontró la tarea "${facts.entities.tarea_titulo}" en la columna "${facts.entities.columna_nombre}".`
            : `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`

          return {
            success: false,
            message: mensaje,
            actionTaken: false,
          }
        }

        console.log("Tarea encontrada por coincidencia parcial:", taskPartialMatch.title)
        console.log("Estableciendo fecha:", facts.entities.tarea_fecha)

        // Actualizar la tarea encontrada por coincidencia parcial
        const updateResult = await tasksCollection.updateOne(
          { _id: taskPartialMatch._id },
          {
            $set: {
              dueDate: new Date(facts.entities.tarea_fecha),
              updatedAt: new Date(),
            },
          },
        )

        if (updateResult.matchedCount === 1) {
          // Formatear la fecha para mostrarla en el mensaje
          const fechaFormateada = DateParser.formatDate(new Date(facts.entities.tarea_fecha))
          const expresionOriginal = facts.entities.tarea_fecha_expresion || facts.entities.tarea_fecha

          return {
            success: true,
            message: `Fecha de vencimiento de la tarea "${taskPartialMatch.title}" actualizada a ${fechaFormateada} (${expresionOriginal}).`,
            actionTaken: true,
          }
        }
      } else {
        console.log("Tarea encontrada:", task.title)
        console.log("Estableciendo fecha:", facts.entities.tarea_fecha)

        // Actualizar la tarea encontrada
        const updateResult = await tasksCollection.updateOne(
          { _id: task._id },
          {
            $set: {
              dueDate: new Date(facts.entities.tarea_fecha),
              updatedAt: new Date(),
            },
          },
        )

        if (updateResult.matchedCount === 1) {
          // Formatear la fecha para mostrarla en el mensaje
          const fechaFormateada = DateParser.formatDate(new Date(facts.entities.tarea_fecha))
          const expresionOriginal = facts.entities.tarea_fecha_expresion || facts.entities.tarea_fecha

          return {
            success: true,
            message: `Fecha de vencimiento de la tarea "${task.title}" actualizada a ${fechaFormateada} (${expresionOriginal}).`,
            actionTaken: true,
          }
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar la fecha de vencimiento de la tarea.",
        actionTaken: false,
      }
    },
    priority: 7,
  },

  // R12: Asignar o remover miembros de una tarea - MEJORADO
  {
    id: "R12",
    condition: (facts: Facts) => {
      console.log("Evaluando regla R12 (gestionar miembros):", facts)
      return (
        facts.intent === "gestionar_miembros" &&
        facts.entities?.tarea_titulo &&
        facts.entities?.tarea_miembros &&
        facts.entities?.accion_miembro &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      console.log("Ejecutando acción para gestionar miembros:", facts.entities)

      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudieron gestionar los miembros de la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Construir la consulta para buscar la tarea
      const taskQuery: any = {
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      }

      // Si se especificó una columna, añadirla a la consulta
      if (facts.entities.columna_nombre) {
        // Primero buscar la columna por nombre
        const column = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!column) {
          return {
            success: false,
            message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Añadir el ID de la columna a la consulta
        taskQuery.columnId = column._id
      }

      // Buscar la tarea
      console.log("Buscando tarea:", taskQuery)
      const task = await tasksCollection.findOne(taskQuery)

      if (!task) {
        console.log("No se encontró la tarea con búsqueda exacta")

        // Si no se encontró con título exacto, intentar con búsqueda parcial
        const taskPartialMatch = await tasksCollection.findOne({
          title: { $regex: new RegExp(facts.entities.tarea_titulo, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!taskPartialMatch) {
          const mensaje = facts.entities.columna_nombre
            ? `No se encontró la tarea "${facts.entities.tarea_titulo}" en la columna "${facts.entities.columna_nombre}".`
            : `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`

          return {
            success: false,
            message: mensaje,
            actionTaken: false,
          }
        }

        console.log("Tarea encontrada por coincidencia parcial:", taskPartialMatch.title)

        // Gestionar miembros para la tarea encontrada por coincidencia parcial
        const result = await gestionarMiembros(facts, tasksCollection, taskPartialMatch)
        return result
      } else {
        console.log("Tarea encontrada:", task.title)

        // Gestionar miembros para la tarea encontrada
        const result = await gestionarMiembros(facts, tasksCollection, task)
        return result
      }
    },
    priority: 7,
  },

  // R13: Mover una tarea a otra columna - MEJORADO
  {
    id: "R13",
    condition: (facts: Facts) => {
      return (
        facts.intent === "mover_tarea" &&
        facts.entities?.tarea_titulo &&
        facts.entities?.columna_destino &&
        facts.boardId
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo mover la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Construir la consulta para buscar la tarea
      const taskQuery: any = {
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      }

      // Si se especificó una columna origen, añadirla a la consulta
      if (facts.entities.columna_nombre) {
        // Primero buscar la columna por nombre
        const column = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!column) {
          return {
            success: false,
            message: `No se encontró la columna origen "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Añadir el ID de la columna a la consulta
        taskQuery.columnId = column._id
      }

      // Buscar la tarea
      const task = await tasksCollection.findOne(taskQuery)

      if (!task) {
        // Si no se encontró con título exacto, intentar con búsqueda parcial
        const taskPartialMatch = await tasksCollection.findOne({
          title: { $regex: new RegExp(facts.entities.tarea_titulo, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!taskPartialMatch) {
          const mensaje = facts.entities.columna_nombre
            ? `No se encontró la tarea "${facts.entities.tarea_titulo}" en la columna "${facts.entities.columna_nombre}".`
            : `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`

          return {
            success: false,
            message: mensaje,
            actionTaken: false,
          }
        }

        // Buscar la columna origen para el mensaje
        const sourceColumn = await columnsCollection.findOne({ _id: taskPartialMatch.columnId })
        const sourceColumnName = sourceColumn ? sourceColumn.name : "desconocida"

        // Buscar la columna destino
        const destColumn = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_destino}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!destColumn) {
          // Intentar con búsqueda parcial para la columna destino
          const destColumnPartial = await columnsCollection.findOne({
            name: { $regex: new RegExp(facts.entities.columna_destino, "i") },
            boardId: convertToObjectId(facts.boardId),
          })

          if (!destColumnPartial) {
            return {
              success: false,
              message: `No se encontró la columna destino "${facts.entities.columna_destino}" en este tablero.`,
              actionTaken: false,
            }
          }

          // Mover la tarea a la columna encontrada por coincidencia parcial
          const updateResult = await tasksCollection.updateOne(
            { _id: taskPartialMatch._id },
            {
              $set: {
                columnId: destColumnPartial._id,
                updatedAt: new Date(),
              },
            },
          )

          if (updateResult.matchedCount === 1) {
            return {
              success: true,
              message: `Tarea "${taskPartialMatch.title}" movida de la columna "${sourceColumnName}" a la columna "${destColumnPartial.name}".`,
              actionTaken: true,
            }
          }
        } else {
          // Mover la tarea a la columna destino
          const updateResult = await tasksCollection.updateOne(
            { _id: taskPartialMatch._id },
            {
              $set: {
                columnId: destColumn._id,
                updatedAt: new Date(),
              },
            },
          )

          if (updateResult.matchedCount === 1) {
            return {
              success: true,
              message: `Tarea "${taskPartialMatch.title}" movida de la columna "${sourceColumnName}" a la columna "${destColumn.name}".`,
              actionTaken: true,
            }
          }
        }
      } else {
        // Buscar la columna origen para el mensaje
        const sourceColumn = await columnsCollection.findOne({ _id: task.columnId })
        const sourceColumnName = sourceColumn ? sourceColumn.name : "desconocida"

        // Buscar la columna destino
        const destColumn = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_destino}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!destColumn) {
          // Intentar con búsqueda parcial para la columna destino
          const destColumnPartial = await columnsCollection.findOne({
            name: { $regex: new RegExp(facts.entities.columna_destino, "i") },
            boardId: convertToObjectId(facts.boardId),
          })

          if (!destColumnPartial) {
            return {
              success: false,
              message: `No se encontró la columna destino "${facts.entities.columna_destino}" en este tablero.`,
              actionTaken: false,
            }
          }

          // Mover la tarea a la columna encontrada por coincidencia parcial
          const updateResult = await tasksCollection.updateOne(
            { _id: task._id },
            {
              $set: {
                columnId: destColumnPartial._id,
                updatedAt: new Date(),
              },
            },
          )

          if (updateResult.matchedCount === 1) {
            return {
              success: true,
              message: `Tarea "${task.title}" movida de la columna "${sourceColumnName}" a la columna "${destColumnPartial.name}".`,
              actionTaken: true,
            }
          }
        } else {
          // Mover la tarea a la columna destino
          const updateResult = await tasksCollection.updateOne(
            { _id: task._id },
            {
              $set: {
                columnId: destColumn._id,
                updatedAt: new Date(),
              },
            },
          )

          if (updateResult.matchedCount === 1) {
            return {
              success: true,
              message: `Tarea "${task.title}" movida de la columna "${sourceColumnName}" a la columna "${destColumn.name}".`,
              actionTaken: true,
            }
          }
        }
      }

      return {
        success: false,
        message: "No se pudo mover la tarea.",
        actionTaken: false,
      }
    },
    priority: 8,
  },

  // R14: Marcar tarea como completada - MEJORADO
  {
    id: "R14",
    condition: (facts: Facts) => {
      return facts.intent === "completar_tarea" && facts.entities?.tarea_titulo && facts.boardId
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      if (!facts.boardId) {
        return {
          success: false,
          message: "No se pudo completar la tarea: no hay un tablero seleccionado.",
          actionTaken: false,
        }
      }

      const tasksCollection = await getCollection("tasks")
      const columnsCollection = await getCollection("columns")

      // Construir la consulta para buscar la tarea
      const taskQuery: any = {
        title: { $regex: new RegExp(`^${facts.entities.tarea_titulo}$`, "i") },
        boardId: convertToObjectId(facts.boardId),
      }

      // Si se especificó una columna, añadirla a la consulta
      if (facts.entities.columna_nombre) {
        // Primero buscar la columna por nombre
        const column = await columnsCollection.findOne({
          name: { $regex: new RegExp(`^${facts.entities.columna_nombre}$`, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!column) {
          return {
            success: false,
            message: `No se encontró la columna "${facts.entities.columna_nombre}" en este tablero.`,
            actionTaken: false,
          }
        }

        // Añadir el ID de la columna a la consulta
        taskQuery.columnId = column._id
      }

      // Buscar la tarea
      const task = await tasksCollection.findOne(taskQuery)

      if (!task) {
        // Si no se encontró con título exacto, intentar con búsqueda parcial
        const taskPartialMatch = await tasksCollection.findOne({
          title: { $regex: new RegExp(facts.entities.tarea_titulo, "i") },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!taskPartialMatch) {
          const mensaje = facts.entities.columna_nombre
            ? `No se encontró la tarea "${facts.entities.tarea_titulo}" en la columna "${facts.entities.columna_nombre}".`
            : `No se encontró la tarea "${facts.entities.tarea_titulo}" en este tablero.`

          return {
            success: false,
            message: mensaje,
            actionTaken: false,
          }
        }

        // Buscar la columna origen para el mensaje
        const sourceColumn = await columnsCollection.findOne({ _id: taskPartialMatch.columnId })
        const sourceColumnName = sourceColumn ? sourceColumn.name : "desconocida"

        // Buscar la columna "Completadas"
        const completedColumn = await columnsCollection.findOne({
          name: { $regex: /^Completadas$/i },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!completedColumn) {
          return {
            success: false,
            message: 'No se encontró la columna "Completadas" en este tablero.',
            actionTaken: false,
          }
        }

        // Mover la tarea a "Completadas"
        const updateResult = await tasksCollection.updateOne(
          { _id: taskPartialMatch._id },
          {
            $set: {
              columnId: completedColumn._id,
              updatedAt: new Date(),
            },
          },
        )

        if (updateResult.matchedCount === 1) {
          return {
            success: true,
            message: `Tarea "${taskPartialMatch.title}" marcada como completada y movida de la columna "${sourceColumnName}" a la columna "Completadas".`,
            actionTaken: true,
          }
        }
      } else {
        // Buscar la columna origen para el mensaje
        const sourceColumn = await columnsCollection.findOne({ _id: task.columnId })
        const sourceColumnName = sourceColumn ? sourceColumn.name : "desconocida"

        // Buscar la columna "Completadas"
        const completedColumn = await columnsCollection.findOne({
          name: { $regex: /^Completadas$/i },
          boardId: convertToObjectId(facts.boardId),
        })

        if (!completedColumn) {
          return {
            success: false,
            message: 'No se encontró la columna "Completadas" en este tablero.',
            actionTaken: false,
          }
        }

        // Mover la tarea a "Completadas"
        const updateResult = await tasksCollection.updateOne(
          { _id: task._id },
          {
            $set: {
              columnId: completedColumn._id,
              updatedAt: new Date(),
            },
          },
        )

        if (updateResult.matchedCount === 1) {
          return {
            success: true,
            message: `Tarea "${task.title}" marcada como completada y movida de la columna "${sourceColumnName}" a la columna "Completadas".`,
            actionTaken: true,
          }
        }
      }

      return {
        success: false,
        message: "No se pudo marcar la tarea como completada.",
        actionTaken: false,
      }
    },
    priority: 8,
  },
]

// Función auxiliar para crear una tarea en una columna específica
async function createTaskInColumn(facts: Facts, tasksCollection: any, column: any): Promise<ActionResult> {
  // Crear la tarea
  const taskData: TaskData = {
    title: facts.entities.tarea_titulo,
    description: facts.entities.tarea_descripcion || "",
    columnId: column._id,
    boardId: facts.boardId ? convertToObjectId(facts.boardId) : null,
    priority: facts.entities.tarea_prioridad || "Media",
    members: facts.entities.tarea_miembros || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Añadir fecha de vencimiento si se proporcionó
  if (facts.entities.tarea_fecha) {
    taskData.dueDate = new Date(facts.entities.tarea_fecha)
  }

  const result = await tasksCollection.insertOne(taskData)

  if (result.acknowledged) {
    let message = `Tarea "${facts.entities.tarea_titulo}" creada con éxito en la columna "${column.name}".`

    // Añadir información sobre la fecha si se estableció
    if (facts.entities.tarea_fecha) {
      const fechaFormateada = DateParser.formatDate(new Date(facts.entities.tarea_fecha))
      message += ` Fecha de vencimiento: ${fechaFormateada}.`
    }

    // Añadir información sobre la prioridad si se estableció
    if (facts.entities.tarea_prioridad) {
      message += ` Prioridad: ${taskData.priority}.`
    }

    // Añadir información sobre los miembros si se establecieron
    if (facts.entities.tarea_miembros && facts.entities.tarea_miembros.length > 0) {
      message += ` Miembros: ${facts.entities.tarea_miembros.join(", ")}.`
    }

    return {
      success: true,
      message,
      actionTaken: true,
    }
  }

  return {
    success: false,
    message: "No se pudo crear la tarea.",
    actionTaken: false,
  }
}

// Función auxiliar para gestionar miembros de una tarea
async function gestionarMiembros(facts: Facts, tasksCollection: any, task: any): Promise<ActionResult> {
  let updateOperation = {}
  const accion = facts.entities.accion_miembro.toLowerCase()
  console.log("Acción a realizar:", accion)

  if (accion === "agregar" || accion === "asignar" || accion === "añadir") {
    // Añadir miembros
    updateOperation = {
      $addToSet: { members: { $each: facts.entities.tarea_miembros } },
      $set: { updatedAt: new Date() },
    }
  } else if (accion === "quitar" || accion === "eliminar" || accion === "remover") {
    // Quitar miembros
    updateOperation = {
      $pull: { members: { $in: facts.entities.tarea_miembros } },
      $set: { updatedAt: new Date() },
    }
  } else {
    return {
      success: false,
      message: 'Acción no reconocida. Use "agregar" o "quitar".',
      actionTaken: false,
    }
  }

  console.log("Operación de actualización:", updateOperation)
  const updateResult = await tasksCollection.updateOne({ _id: task._id }, updateOperation)
  console.log("Resultado de la actualización:", updateResult)

  if (updateResult.matchedCount === 1) {
    const accionTexto =
      accion === "agregar" || accion === "asignar" || accion === "añadir" ? "asignados a" : "removidos de"
    const miembrosTexto = facts.entities.tarea_miembros.join(", ")

    return {
      success: true,
      message: `Miembros ${miembrosTexto} ${accionTexto} la tarea "${task.title}" correctamente.`,
      actionTaken: true,
    }
  }

  return {
    success: false,
    message: "No se pudieron actualizar los miembros de la tarea.",
    actionTaken: false,
  }
}
