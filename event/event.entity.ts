import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('categories')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('varchar', { nullable: false, length: 255 })
  name: string

  @Column('varchar', { nullable: false, length: 255 })
  description: string
}
