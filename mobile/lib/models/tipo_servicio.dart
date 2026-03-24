class TipoServicio {
  final String id;
  final String nombreTs;
  bool estado;

  TipoServicio({
  required this.id, 
  required this.nombreTs,
  required this.estado
  });

  factory TipoServicio.fromJson(Map<String, dynamic> json)
  {
    return TipoServicio(
      id: json['_id'] ?? '', 
      nombreTs: json['nombreTs'] ?? '',
      estado: json['estado'] ?? true,
      );
  }

  Map<String, dynamic> toJson(){
    return {
      '_id': id,
      'nombreTs': nombreTs,
      'estado': estado
    };
  }

}
