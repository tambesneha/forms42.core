/*
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 only, as
 * published by the Free Software Foundation.

 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 */

import { BindValue } from "./BindValue.js";
import { Record } from "../model/Record.js";
import { SQLStatement } from "./SQLStatement.js";
import { Filters } from "../model/filters/Filters.js";
import { Filter } from "../model/interfaces/Filter.js";
import { FilterStructure } from "../model/FilterStructure.js";

export class SQLBuilder
{
	public static select(table:string, columns:string[], filter:FilterStructure, order:string) : SQLStatement
	{
		let parsed:SQLStatement =
			new SQLStatement();

		let stmt:string = "select ";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += columns[i];
		}

		stmt += " from "+table;

		if (filter && !filter.empty)
			stmt += " where " + filter.asSQL();

		if (order)
			stmt += " order by "+order;

		parsed.stmt = stmt;
		parsed.bindvalues = filter?.getBindValues();

		return(parsed);
	}

	public static fetch(cursor:string) : SQLStatement
	{
		let parsed:SQLStatement = new SQLStatement();
		parsed.stmt = '{"cursor": "'+ cursor+'" }';
		return(parsed);
	}

	public static insert(table:string, columns:string[], record:Record, returnclause:string) : SQLStatement
	{
		let binds:BindValue[] = [];
		let parsed:SQLStatement = new SQLStatement();

		let stmt:string = "insert into "+table+"(";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += columns[i];
		}

		stmt += ") values (";

		for (let i = 0; i < columns.length; i++)
		{
			if (i > 0) stmt += ",";
			stmt += ":"+columns[i];

			binds.push(new BindValue(columns[i],record.getValue(columns[i])))
		}

		stmt += ") "+returnclause;

		parsed.stmt = stmt;
		parsed.bindvalues = binds;

		return(parsed);
	}

	public static update(table:string, columns:string[], record:Record, returnclause:string) : SQLStatement
	{
		return(null);
	}

	public static delete(table:string, pkey:string[], record:Record, returnclause:string) : SQLStatement
	{
		let parsed:SQLStatement = new SQLStatement();
		let stmt:string = "delete from "+table+" where ";

		// Mobiloplader + fuldmagt

		let filters:FilterStructure = new FilterStructure();

		for (let i = 0; i < pkey.length; i++)
		{
			let filter:Filter = Filters.Equals(pkey[i]);
			filters.and(filter.setConstraint(record.keys[i]),pkey[i]);
		}

		stmt += " where " + filters.asSQL();

		parsed.stmt = stmt;
		parsed.bindvalues = filters.getBindValues();

		return(parsed);
	}
}