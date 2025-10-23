# SOROBAN Conceptos básicos 


## Entorno Soroban:

***¿Qué es Env y para qué sirve?***
> Es la conexión a la API de Stellar, sirve para consulta y guardado.
>
> 'Env es el contexto del blockchain que provee acceso a: Storage (almacenamiento) - Eventos - Criptografía - Memoria dinámica'

***¿Por qué String y Vec necesitan &env?***
> Porque String y Vec viven en la memoria, y Soroban maneja la memoria a traves de este entorno

## Mutabilidad:

***¿Diferencia entre let x y let mut x?***
		
- let cuenta01 = ********; // Variable fija 

- let mut balance = ******* // Determinamos que la variable puede modificarse
>La diferencia es que a una le asignamos la capacidad de modificar su valor.
	
***¿Por qué Rust prefiere inmutabilidad?***
> **Para prevenir errores fatales, como la perdida de cuentas o reescritura de transacciones.**
>
> *Porque Rust protege tus datos por defecto. Si una variable puede cambiar accidentalmente, pueden pasar cosas malas. En blockchain, esto puede significar balances que cambian sin querer, o tokens que desaparecen.*
>
> Solo usá mut cuando realmente necesités modificar la variable. 			
> 
> **Menos mut = código más seguro**
	
## Tipos:

***¿Cuándo usar u32 vs u128?***

**- u32: Contadores, IDs medianos, cantidades normales**

**- u128: Balances de tokens (el más importante)**
	    
**u32:**    	
 - Contadores que no van a pasar de 4 mil millones
 - IDs de productos, usuarios, transacciones
 - Índices en listas
 - Usa menos espacio que u128 (más eficiente)'
    	
**u128:**
 - Suficientemente grande para cualquier cantidad de tokens
 - Previene overflow en sumas/restas normales
 - Es el estándar en Soroban para balances'

***¿Cuándo usar Symbol vs String?***
	
> Ambos son valores de tipo texto
 - Symbol: Para valores chicos, alojados en el Stack - INMUTABLE y barato (fijo: 8 bytes - Solo ASCII: a-z, A-Z, 0-9, _ - Longitud: 10 caracteres - Uso: Keys, identificadores, eventos - Costo: 8 bytes)
 - String: Valores mutables que pueden crecer mucho, alojados en el Heap - FLEXIBLE y costoso (crece según contenido - Cualquier UTF-8 - longitud ilimitada - Uso: Mensajes de usuarios - Costo: 23 bytes)
    
***¿Qué es symbol_short!?***

**Es un validador de texto, para asegurar uso adecuado del espacio**
	
> Es un macro de Soroban que convierte texto fijo en un tipo Symbol en compile-time.
>
> Esto asegura que:
>   - Solo se usen hasta 10 caracteres
>   - El texto sea válido (solo ASCII alfanumérico + _)
>   - El costo de almacenamiento sea mínimo (~8 bytes)
>   
>  	- **Los errores se detecten al compilar, no al ejecutar**

***¿Qué hace checked_add()?***

>	Es la funcion que coteja si la operacion 'rebalsa' la capacidad del tipo de dato
>
> **Creado para solucionar el problema del overflow**
> 
> Obliga a manejar el error con 'match' - 'Option<T>' - 'Result<T,E>'
>
> ***En smart contracts, SIEMPRE usá checked_* para operaciones con dinero.'***
	
## Ownership:

***¿Las 3 reglas de ownership?***
> - **Cada dato/valor tiene un dueño**
> - **Solo un dueño(variable) para un valor a la vez**
> - **Si el dueño sale del alcance, se destruye automaticamente (osea si el valor ahora pertenece a otra variable, la variable original se destruye)**

***¿Qué es un "move"?***
    Es 'trasladar' el valor de una variable a otra. Una vez hecho el movimiento la primer variable es destruída
    	
***¿Qué tipos se copian y cuáles se mueven?***
	Se copian numeros, se mueven string
		
## Borrowing:

***¿Diferencia entre &T y &mut T?***
    &T: Refiero un dato, solo para leerlo (puedo leer varios datos)
    &mut T: Refiero un dato y puedo modificarlo (solo un dato a la vez)
    		
***¿Por qué solo una referencia mutable?***
	Previene data races (modificación simultánea)
	
#### ***Guía de decisión:***
	**¿Qué necesito hacer?**
			Solo LEER
			   └→ Usar &T
			      fn leer(dato: &String)

			MODIFICAR
			   └→ Usar &mut T
			      fn modificar(dato: &mut Vec<u32>)

			CONSUMIR
			   └→ Tomar ownership (T)
			      fn guardar(dato: String)
	
## Pattern Matching:

***¿Qué hace unwrap_or(0)?***
    Maneja opciones de error 'null'
    Asigno un valor por defecto para que prevenir panic!
    
***¿Diferencia entre Option y Result?***
    Option: Me da l posibilidad de que un valor este vacio (None)
    Result: Me muestra el error de fallor, si la operación no se ejecuta
    	
***¿Por qué NO usar unwrap() en producción?***
	Porque si no manejo correctamente el error puede darse un panic!, la transacción falla tras pagar la transaccion y el usuario pierde gas
		
    'Un panic! detiene toda la transacción
     Los cambios de estado revierten (rollback)
     El usuario pierde el gas pagado
     Es como cancelar un pago después de pagar la comisión bancaria'

	'NUNCA uses unwrap() en producción. Siempre usá unwrap_or(), unwrap_or_else(), o match.'

## Eventos:

***¿Para qué sirven los eventos?***
	Sirven para notificar a API externa, indexar y servir como registro auditable
	
***¿Diferencia entre topics y data?***
	Topics: Etiqueta, tipo de evento
	 'Símbolos para filtrar eventos (indexables)'
	Data: Información del evento en sí
	 'La información completa del evento'
