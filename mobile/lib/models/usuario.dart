class Usuario {
  final String id;
  final String nombre;
  final String email;
  final String password;
  final String confirmPassword;
  final dynamic rol; // Cambiado a dynamic para mayor flexibilidad
  bool estado;

  Usuario({
    required this.id,
    required this.nombre,
    required this.email,
    required this.password,
    required this.confirmPassword,
    required this.rol,
    this.estado = true,
  });

  // Método factory para crear el objeto desde JSON
  factory Usuario.fromJson(Map<String, dynamic> json) {
    try {
      // Imprimir el JSON para depuración
      print('Procesando JSON de usuario: $json');
      
      // Manejar diferentes formatos de ID
      String userId = '';
      if (json.containsKey('_id')) {
        userId = json['_id']?.toString() ?? '';
      } else if (json.containsKey('id')) {
        userId = json['id']?.toString() ?? '';
      }
      
      // Manejar el campo rol que puede ser un objeto, un string o null
      dynamic rolData;
      if (json['rol'] == null) {
        rolData = {'nombreRol': 'Usuario'};
      } else if (json['rol'] is Map) {
        rolData = json['rol'];
      } else if (json['rol'] is String) {
        rolData = {'nombreRol': json['rol']};
      } else {
        rolData = {'nombreRol': 'Usuario'};
      }
      
      // Manejar el campo estado que puede ser bool o string
      bool estadoValue = true;
      if (json.containsKey('estado')) {
        if (json['estado'] is bool) {
          estadoValue = json['estado'];
        } else if (json['estado'] is String) {
          estadoValue = json['estado'].toLowerCase() == 'true';
        }
      }
      
      return Usuario(
        id: userId,
        nombre: json['nombre']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        password: json['password']?.toString() ?? '',
        confirmPassword: json['confirmPassword']?.toString() ?? json['password']?.toString() ?? '',
        rol: rolData,
        estado: estadoValue,
      );
    } catch (e) {
      print('Error al crear Usuario desde JSON: $e');
      rethrow; // Relanzar la excepción para que pueda ser manejada en un nivel superior
    }
  }

  // Método para convertir el objeto Usuario a JSON
  Map<String, dynamic> toJson() {
    try {
      Map<String, dynamic> json = {
        '_id': id,
        'nombre': nombre,
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'estado': estado,
      };
      
      // Manejar el campo rol según su tipo
      if (rol is Map) {
        json['rol'] = rol;
      } else if (rol is String) {
        json['rol'] = rol;
      } else {
        json['rol'] = {'nombreRol': 'Usuario'};
      }
      
      return json;
    } catch (e) {
      print('Error al convertir Usuario a JSON: $e');
      return {
        '_id': id,
        'nombre': nombre,
        'email': email,
      };
    }
  }
  
  // Método para obtener el nombre del rol como string
  String get rolNombre {
    try {
      if (rol is Map) {
        if (rol.containsKey('nombreRol')) {
          return rol['nombreRol']?.toString() ?? 'Usuario';
        }
      } else if (rol is String) {
        return rol;
      }
      return 'Usuario';
    } catch (e) {
      print('Error al obtener rolNombre: $e');
      return 'Usuario';
    }
  }
}
