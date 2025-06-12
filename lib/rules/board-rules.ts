import { getCollection, convertToObjectId } from "../db"
import type { Rule, Facts, ActionResult } from "../types"

// Reglas relacionadas con tableros
export const boardRules: Rule[] = [
  // R1: Crear un tablero
  {
    id: "R1",
    condition: (facts: Facts) => {
      return facts.intent === "crear_tablero" && facts.entities?.tablero_nombre
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      const boardsCollection = await getCollection("boards")
      const result = await boardsCollection.insertOne({
        name: facts.entities.tablero_nombre,
        description: facts.entities.tablero_descripcion || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (result.acknowledged) {
        // Si se crea un tablero, crear columnas por defecto
        const columnsCollection = await getCollection("columns")
        const defaultColumns = [
          { name: "Haciendo", boardId: result.insertedId, order: 0 },
          { name: "En progreso", boardId: result.insertedId, order: 1 },
          { name: "Completadas", boardId: result.insertedId, order: 2 },
        ]

        await columnsCollection.insertMany(
          defaultColumns.map((col) => ({
            ...col,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        )

        return {
          success: true,
          message: `Tablero "${facts.entities.tablero_nombre}" creado con éxito con las columnas predeterminadas.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo crear el tablero.",
        actionTaken: false,
      }
    },
    priority: 10,
  },

  // R2: Eliminar un tablero
  {
    id: "R2",
    condition: (facts: Facts) => {
      return facts.intent === "eliminar_tablero" && (facts.entities?.tablero_id || facts.entities?.tablero_nombre)
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      const boardsCollection = await getCollection("boards")
      let query = {}

      if (facts.entities.tablero_id) {
        query = { _id: convertToObjectId(facts.entities.tablero_id) }
      } else if (facts.entities.tablero_nombre) {
        query = { name: facts.entities.tablero_nombre }
      }

      const board = await boardsCollection.findOne(query)
      if (!board) {
        return {
          success: false,
          message: "No se encontró el tablero especificado.",
          actionTaken: false,
        }
      }

      // Eliminar el tablero
      const deleteResult = await boardsCollection.deleteOne({ _id: board._id })

      if (deleteResult.deletedCount === 1) {
        // Eliminar columnas asociadas
        const columnsCollection = await getCollection("columns")
        await columnsCollection.deleteMany({ boardId: board._id })

        // Eliminar tareas asociadas
        const tasksCollection = await getCollection("tasks")
        await tasksCollection.deleteMany({ boardId: board._id })

        return {
          success: true,
          message: `Tablero "${board.name}" eliminado con éxito junto con todas sus columnas y tareas.`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo eliminar el tablero.",
        actionTaken: false,
      }
    },
    priority: 10,
  },

  // R3: Modificar título de un tablero
  {
    id: "R3",
    condition: (facts: Facts) => {
      return (
        facts.intent === "modificar_tablero" &&
        facts.entities?.tablero_nombre_nuevo &&
        (facts.boardId || facts.entities?.tablero_nombre_actual)
      )
    },
    action: async (facts: Facts): Promise<ActionResult> => {
      const boardsCollection = await getCollection("boards")
      let query = {}

      if (facts.boardId) {
        query = { _id: convertToObjectId(facts.boardId) }
      } else if (facts.entities.tablero_nombre_actual) {
        query = { name: facts.entities.tablero_nombre_actual }
      }

      const updateResult = await boardsCollection.updateOne(query, {
        $set: {
          name: facts.entities.tablero_nombre_nuevo,
          updatedAt: new Date(),
        },
      })

      if (updateResult.matchedCount === 1) {
        return {
          success: true,
          message: `Nombre del tablero actualizado a "${facts.entities.tablero_nombre_nuevo}".`,
          actionTaken: true,
        }
      }

      return {
        success: false,
        message: "No se pudo actualizar el nombre del tablero.",
        actionTaken: false,
      }
    },
    priority: 8,
  },
]
