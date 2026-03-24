import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/models/empleado.dart';

class ApiEmpleado {
  static const String baseUrl = "https://gitbf.onrender.com/api/empleados";

  // Método para obtener todos los empleados
  Future<List<Empleado>> getEmpleados(String token) async {
    try {
      print('Obteniendo empleados con token: $token');
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('Código de respuesta: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        // Imprimir la respuesta completa para depuración
        print('Respuesta completa: ${response.body}');
        
        final dynamic jsonData = jsonDecode(response.body);
        
        // Verificar si la respuesta es un objeto o una lista
        if (jsonData is Map<String, dynamic>) {
          // Si es un objeto, buscar la clave 'empleados'
          if (jsonData.containsKey('empleados')) {
            final List<dynamic> empleadosData = jsonData['empleados'];
            print('Empleados encontrados: ${empleadosData.length}');
            
            // Crear una lista para almacenar los empleados procesados
            List<Empleado> empleados = [];
            
            // Procesar cada empleado individualmente para capturar errores específicos
            for (var i = 0; i < empleadosData.length; i++) {
              try {
                var empleadoData = empleadosData[i];
                print('Procesando empleado $i: $empleadoData');
                empleados.add(Empleado.fromJson(empleadoData));
              } catch (e) {
                print('Error al procesar empleado $i: $e');
                // Continuar con el siguiente empleado en lugar de fallar completamente
              }
            }
            
            return empleados;
          } else {
            // Buscar cualquier lista en la respuesta que pueda contener empleados
            for (var key in jsonData.keys) {
              if (jsonData[key] is List) {
                print('Encontrada lista en clave: $key');
                final List<dynamic> possibleEmpleados = jsonData[key];
                if (possibleEmpleados.isNotEmpty && possibleEmpleados[0] is Map<String, dynamic>) {
                  print('Intentando mapear lista de $key como empleados');
                  
                  // Crear una lista para almacenar los empleados procesados
                  List<Empleado> empleados = [];
                  
                  // Procesar cada empleado individualmente
                  for (var i = 0; i < possibleEmpleados.length; i++) {
                    try {
                      empleados.add(Empleado.fromJson(possibleEmpleados[i]));
                    } catch (e) {
                      print('Error al procesar posible empleado $i: $e');
                      // Continuar con el siguiente
                    }
                  }
                  
                  return empleados;
                }
              }
            }
            
            // Si no hay una lista clara, intentar usar todo el objeto como un solo empleado
            if (jsonData.containsKey('_id') || jsonData.containsKey('id') || 
                jsonData.containsKey('nombreempleado')) {
              print('Intentando mapear objeto como un solo empleado');
              try {
                return [Empleado.fromJson(jsonData)];
              } catch (e) {
                print('Error al procesar objeto como empleado: $e');
                return [];
              }
            }
            
            print('No se encontró una estructura de empleados reconocible');
            return [];
          }
        } else if (jsonData is List) {
          // Si la respuesta es directamente una lista, asumimos que son empleados
          print('La respuesta es una lista directa. Elementos: ${jsonData.length}');
          
          // Crear una lista para almacenar los empleados procesados
          List<Empleado> empleados = [];
          
          // Procesar cada empleado individualmente
          for (var i = 0; i < jsonData.length; i++) {
            try {
              empleados.add(Empleado.fromJson(jsonData[i]));
            } catch (e) {
              print('Error al procesar empleado de lista $i: $e');
              // Continuar con el siguiente
            }
          }
          
          return empleados;
        } else {
          print('Formato de respuesta inesperado: ${jsonData.runtimeType}');
          return [];
        }
      } else {
        print('Error en la respuesta: ${response.statusCode} - ${response.body}');
        throw Exception('Problema al cargar los datos de los empleados! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al obtener empleados: $e');
      throw Exception('Error al obtener empleados: $e');
    }
  }

  // Método para obtener un empleado por ID
  Future<Empleado> getEmpleadoPorId(String token, String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final dynamic jsonData = jsonDecode(response.body);
        
        if (jsonData is Map<String, dynamic>) {
          if (jsonData.containsKey('empleado')) {
            return Empleado.fromJson(jsonData['empleado']);
          } else {
            return Empleado.fromJson(jsonData);
          }
        } else {
          throw Exception('Formato de respuesta inválido');
        }
      } else {
        throw Exception('Problema al cargar el empleado! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al obtener empleado por ID: $e');
      throw Exception('Error al obtener empleado: $e');
    }
  }

  // Método para agregar un empleado
  Future<void> addEmpleado(String token, Empleado empleado) async {
    try {
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(empleado.toJson()),
      );

      if (response.statusCode != 201) {
        throw Exception('Problema al agregar el empleado! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al agregar empleado: $e');
      throw Exception('Error al agregar empleado: $e');
    }
  }

  // Método para actualizar un empleado
  Future<void> updateEmpleado(String token, Empleado empleado) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/${empleado.id}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(empleado.toJson()),
      );

      if (response.statusCode != 200) {
        throw Exception('Problema al actualizar el empleado! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al actualizar empleado: $e');
      throw Exception('Error al actualizar empleado: $e');
    }
  }

  // Método para eliminar un empleado
  Future<void> deleteEmpleado(String token, String id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Problema al eliminar el empleado! Código: ${response.statusCode}');
      }
    } catch (e) {
      print('Excepción al eliminar empleado: $e');
      throw Exception('Error al eliminar empleado: $e');
    }
  }
}
