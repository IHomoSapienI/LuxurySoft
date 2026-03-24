class Empleado {
  final String id;
  final String nombreempleado;
  final String apellidoempleado;
  final String correoempleado;
  final String telefonoempleado;
  final bool estadoempleado;

  Empleado({
    required this.id,
    required this.nombreempleado,
    required this.apellidoempleado,
    required this.correoempleado,
    required this.telefonoempleado,
    required this.estadoempleado
  });

  factory Empleado.fromJson(Map<String, dynamic> json) {
    try {
      // Imprimir el JSON para depuración
      print('Procesando JSON de empleado: $json');
      
      // Manejar diferentes formatos de ID
      String empleadoId = '';
      if (json.containsKey('_id')) {
        empleadoId = json['_id']?.toString() ?? '';
      } else if (json.containsKey('id')) {
        empleadoId = json['id']?.toString() ?? '';
      }
      
      // Manejar el campo estado que puede ser bool o string
      bool estadoValue = true;
      if (json.containsKey('estadoempleado')) {
        if (json['estadoempleado'] is bool) {
          estadoValue = json['estadoempleado'];
        } else if (json['estadoempleado'] is String) {
          estadoValue = json['estadoempleado'].toLowerCase() == 'true';
        }
      }
      
      return Empleado(
        id: empleadoId,
        nombreempleado: json['nombreempleado']?.toString() ?? '',
        apellidoempleado: json['apellidoempleado']?.toString() ?? '',
        correoempleado: json['correoempleado']?.toString() ?? '',
        telefonoempleado: json['telefonoempleado']?.toString() ?? '',
        estadoempleado: estadoValue,
      );
    } catch (e) {
      print('Error al crear Empleado desde JSON: $e');
      rethrow; // Relanzar la excepción para que pueda ser manejada en un nivel superior
    }
  }

  Map<String, dynamic> toJson() {
    try {
      return {
        '_id': id,
        'nombreempleado': nombreempleado,
        'apellidoempleado': apellidoempleado,
        'correoempleado': correoempleado,
        'telefonoempleado': telefonoempleado,
        'estadoempleado': estadoempleado
      };
    } catch (e) {
      print('Error al convertir Empleado a JSON: $e');
      return {
        '_id': id,
        'nombreempleado': nombreempleado,
      };
    }
  }
  
  // Método para obtener el nombre completo
  String get nombreCompleto {
    return '$nombreempleado $apellidoempleado';
  }
}
