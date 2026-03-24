class Cliente {
  final String id;
  final String nombrecliente;
  final String correocliente;
  final String celularcliente;
  final bool estadocliente;

  Cliente({
    required this.id, 
    required this.nombrecliente,
    required this.correocliente,
    required this.celularcliente,
    required this.estadocliente
  });

  factory Cliente.fromJson(Map<String, dynamic> json)
  {
    return Cliente(
      id: json['_id'] ?? '',
      nombrecliente: json['nombrecliente'] ?? '',
      correocliente: json['correocliente'] ?? '',
      celularcliente: json['celularcliente'] ?? '',
      estadocliente: json['estadocliente'] ?? true
    );
  }

  Map<String, dynamic>toJson(){
    return{
      '_id':id,
      'nombrecliente': nombrecliente,
      'correocliente': correocliente,
      'celularcliente': celularcliente,
      'estadocliente':estadocliente
    };
  }

}
